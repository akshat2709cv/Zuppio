(function () {
  const dataNode = document.querySelector("#storeLocatorData");
  const form = document.querySelector(".store-finder-form");
  const mapCanvas = document.querySelector("#whereToBuyMap");
  const fallback = document.querySelector("[data-map-fallback]");
  const status = document.querySelector("#finderStatus");
  const resultsGrid = document.querySelector("#storeResults");
  const emptyMessage = document.querySelector("#storeEmptyMessage");
  const resultCount = document.querySelector("#storeResultCount");
  const mapsLink = document.querySelector("#openGoogleMaps");
  const useLocationButton = document.querySelector("[data-use-location]");

  if (!dataNode || !form || !resultsGrid) return;

  let config = {};
  try {
    config = JSON.parse(dataNode.dataset.config || "{}");
  } catch (_error) {
    config = {};
  }

  const stores = Array.isArray(config.stores) ? config.stores : [];
  const mapConfig = config.map || {};
  const defaultCenter = normalizeCenter(mapConfig.defaultCenter) || { lat: 28.5355, lng: 77.391, zoom: 11 };
  const noStoresMessage = mapConfig.noStoresMessage || "No ZUPPIO stores found in this area yet. Please contact us on WhatsApp for availability.";
  const apiMissingMessage = mapConfig.apiMissingMessage || "Map API key is not configured.";
  const state = {
    center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
    centerLabel: mapConfig.defaultQuery || "Noida Delhi NCR",
    map: null,
    geocoder: null,
    infoWindow: null,
    markers: [],
    userMarker: null,
    lastResults: []
  };

  function normalizeCenter(value) {
    if (!value) return null;
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    const zoom = Number(value.zoom || 11);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, zoom: Number.isFinite(zoom) ? zoom : 11 };
  }

  function getStorePosition(store) {
    const lat = Number(store.latitude);
    const lng = Number(store.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseRadius(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 25;
  }

  function distanceKm(pointA, pointB) {
    if (!pointA || !pointB) return null;
    const earthRadiusKm = 6371;
    const toRad = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRad(pointB.lat - pointA.lat);
    const dLng = toRad(pointB.lng - pointA.lng);
    const lat1 = toRad(pointA.lat);
    const lat2 = toRad(pointB.lat);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getFilters() {
    const formData = new FormData(form);
    return {
      pincode: String(formData.get("pincode") || "").trim(),
      category: String(formData.get("category") || "Any").trim(),
      product: String(formData.get("product") || "All products").trim(),
      radiusLabel: String(formData.get("radius") || "Within 25 km").trim()
    };
  }

  function hydrateFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    ["pincode", "category", "product", "radius"].forEach((key) => {
      if (!params.has(key)) return;
      const field = form.elements[key];
      if (field) field.value = params.get(key);
    });
  }

  function updateUrlFromFilters(filters) {
    const params = new URLSearchParams();
    if (filters.pincode) params.set("pincode", filters.pincode);
    if (filters.category && filters.category !== "Any") params.set("category", filters.category);
    if (filters.product && filters.product !== "All products") params.set("product", filters.product);
    if (filters.radiusLabel) params.set("radius", filters.radiusLabel);
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  function hasCategory(store, category) {
    if (!category || category === "Any") return true;
    const categories = Array.isArray(store.categories) ? store.categories : [store.category].filter(Boolean);
    return categories.some((item) => String(item).toLowerCase() === category.toLowerCase());
  }

  function hasProduct(store, product) {
    if (!product || product === "All products") return true;
    const products = Array.isArray(store.products) ? store.products : [];
    return products.some((item) => String(item).toLowerCase() === product.toLowerCase());
  }

  function createMapsSearchUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function createStoreMapsUrl(store) {
    const position = getStorePosition(store);
    if (position) return createMapsSearchUrl(`${position.lat},${position.lng}`);
    return createMapsSearchUrl(`${store.name || "ZUPPIO Snacks"} ${store.address || ""}`);
  }

  function setTopMapsLink(query) {
    if (!mapsLink) return;
    mapsLink.href = createMapsSearchUrl(query || "ZUPPIO Snacks near Noida Delhi NCR");
  }

  function setFallback(title, detail, shouldShow) {
    if (!fallback) return;
    const heading = fallback.querySelector("h3");
    const text = fallback.querySelector("p");
    if (heading) heading.textContent = title;
    if (text) text.textContent = detail || "";
    fallback.classList.toggle("show", Boolean(shouldShow));
  }

  function resolveCenterFromKnownStore(pincode) {
    if (!pincode) return null;
    const match = stores.find((store) => String(store.pincode || "") === pincode && getStorePosition(store));
    if (!match) return null;
    return { ...getStorePosition(match), label: pincode };
  }

  function geocodePincode(pincode) {
    if (!pincode || !state.geocoder) return Promise.resolve(null);
    return new Promise((resolve) => {
      state.geocoder.geocode({ address: `${pincode}, India` }, function (results, geocodeStatus) {
        if (geocodeStatus !== "OK" || !results || !results[0]) {
          resolve(null);
          return;
        }
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng(), label: pincode });
      });
    });
  }

  async function resolveSearchCenter(filters, overrideCenter) {
    if (overrideCenter) return overrideCenter;
    if (!filters.pincode) {
      return { lat: defaultCenter.lat, lng: defaultCenter.lng, label: mapConfig.defaultQuery || "Noida / Delhi NCR" };
    }

    const knownStoreCenter = resolveCenterFromKnownStore(filters.pincode);
    if (knownStoreCenter) return knownStoreCenter;

    const geocodedCenter = await geocodePincode(filters.pincode);
    if (geocodedCenter) return geocodedCenter;

    return null;
  }

  function filterStores(filters, center) {
    const radiusKm = parseRadius(filters.radiusLabel);
    const shouldApplyRadius = Boolean(filters.pincode) || center?.label === "your current location";
    return stores
      .map((store) => {
        const position = getStorePosition(store);
        const distance = position && center ? distanceKm(center, position) : null;
        return { ...store, distanceKm: distance };
      })
      .filter((store) => hasCategory(store, filters.category))
      .filter((store) => hasProduct(store, filters.product))
      .filter((store) => {
        if (!shouldApplyRadius) return true;
        if (filters.pincode && String(store.pincode || "") === filters.pincode) return true;
        if (store.distanceKm === null) return false;
        return store.distanceKm <= radiusKm;
      })
      .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  function formatDistance(distance) {
    if (!Number.isFinite(distance)) return "Distance not available";
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(distance >= 10 ? 0 : 1)} km`;
  }

  function phoneDigits(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "917011992634";
    return digits.length === 10 ? `91${digits}` : digits;
  }

  function createStoreCard(store) {
    const products = Array.isArray(store.products) ? store.products : [];
    const phone = store.phone || "+91 7011992634";
    const whatsappText = `Hello ZUPPIO Team, I want to buy ${products.join(", ") || "ZUPPIO products"} from ${store.name || "your store"}.`;
    const card = document.createElement("article");
    card.className = "store-result-card glass-card";
    card.innerHTML = `
      <div class="store-result-top">
        <span class="option-status">${escapeHtml(store.type || "Store")}</span>
        <strong>${escapeHtml(formatDistance(store.distanceKm))}</strong>
      </div>
      <h3>${escapeHtml(store.name)}</h3>
      <p>${escapeHtml(store.address)}</p>
      <p class="store-result-meta">${escapeHtml(store.city)} ${escapeHtml(store.pincode)}</p>
      <p class="store-result-products">${escapeHtml(products.join(" / ") || "ZUPPIO products")}</p>
      <div class="store-result-actions">
        <a class="button secondary" href="tel:${escapeHtml(phone.replace(/\s/g, ""))}">Call <i data-lucide="phone"></i></a>
        <a class="button secondary" href="https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(whatsappText)}" target="_blank" rel="noopener noreferrer">WhatsApp <i data-lucide="message-circle"></i></a>
        <a class="button primary" href="${createStoreMapsUrl(store)}" target="_blank" rel="noopener noreferrer">Open Map <i data-lucide="map-pin"></i></a>
      </div>
    `;
    return card;
  }

  function renderResults(results) {
    resultsGrid.innerHTML = "";
    if (resultCount) resultCount.textContent = `${results.length} ${results.length === 1 ? "store" : "stores"}`;

    if (emptyMessage) {
      emptyMessage.textContent = noStoresMessage;
      emptyMessage.hidden = results.length > 0;
    }

    results.forEach((store) => {
      resultsGrid.appendChild(createStoreCard(store));
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function clearMarkers() {
    state.markers.forEach((marker) => marker.setMap(null));
    state.markers = [];
  }

  function updateMarkers(results, center) {
    if (!state.map || !window.google) return;
    clearMarkers();

    const bounds = new google.maps.LatLngBounds();
    if (center) bounds.extend(center);

    results.forEach((store) => {
      const position = getStorePosition(store);
      if (!position) return;

      const marker = new google.maps.Marker({
        position,
        map: state.map,
        title: store.name
      });

      marker.addListener("click", function () {
        if (!state.infoWindow) state.infoWindow = new google.maps.InfoWindow();
        state.infoWindow.setContent(`
          <strong>${escapeHtml(store.name)}</strong><br />
          ${escapeHtml(store.address)}<br />
          ${escapeHtml(Array.isArray(store.products) ? store.products.join(" / ") : "")}
        `);
        state.infoWindow.open(state.map, marker);
        setTopMapsLink(`${store.name} ${store.address}`);
      });

      state.markers.push(marker);
      bounds.extend(position);
    });

    if (results.length > 1) {
      state.map.fitBounds(bounds, 60);
    } else if (results.length === 1) {
      state.map.setCenter(getStorePosition(results[0]));
      state.map.setZoom(14);
    } else if (center) {
      state.map.setCenter(center);
      state.map.setZoom(defaultCenter.zoom || 11);
    }
  }

  function updateMapCenter(center) {
    if (!state.map || !center) return;
    state.map.setCenter(center);
  }

  async function runSearch(options = {}) {
    const filters = getFilters();
    const center = await resolveSearchCenter(filters, options.center);
    const searchPlace = center ? center.label || filters.pincode || mapConfig.defaultQuery || "Noida Delhi NCR" : filters.pincode;
    const results = center ? filterStores(filters, center) : [];
    const searchSummary = [filters.product, filters.category, filters.radiusLabel].filter(Boolean).join(" / ");

    state.center = center || { lat: defaultCenter.lat, lng: defaultCenter.lng };
    state.centerLabel = searchPlace || "Noida Delhi NCR";
    state.lastResults = results;

    renderResults(results);
    updateMapCenter(center);
    updateMarkers(results, center);
    setTopMapsLink(`ZUPPIO Snacks near ${searchPlace || "Noida Delhi NCR"}`);

    if (status) {
      if (results.length) {
        status.textContent = `Showing ${searchSummary} around ${searchPlace || "Noida / Delhi NCR"}.`;
      } else {
        status.textContent = noStoresMessage;
      }
    }
  }

  function setupTabs() {
    document.querySelectorAll(".where-options-card").forEach(function (section) {
      const tabs = Array.from(section.querySelectorAll("[data-buying-tab]"));
      const options = Array.from(section.querySelectorAll("[data-buying-option]"));

      function showTab(tabId) {
        tabs.forEach(function (tab) {
          const isActive = tab.dataset.buyingTab === tabId;
          tab.classList.toggle("active", isActive);
          tab.setAttribute("aria-selected", String(isActive));
        });

        options.forEach(function (option) {
          option.classList.toggle("hidden", option.dataset.optionTab !== tabId);
        });
      }

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          showTab(tab.dataset.buyingTab);
        });
      });
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const filters = getFilters();
    updateUrlFromFilters(filters);
    runSearch();
  });

  if (useLocationButton) {
    useLocationButton.addEventListener("click", function () {
      if (!navigator.geolocation) {
        if (status) status.textContent = "Location access is not available in this browser.";
        return;
      }

      useLocationButton.disabled = true;
      if (status) status.textContent = "Checking your location...";

      navigator.geolocation.getCurrentPosition(
        function (position) {
          const center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "your current location"
          };
          const pincodeInput = form.querySelector("#finder-pincode");
          if (pincodeInput) pincodeInput.value = "";

          if (state.map && window.google) {
            if (state.userMarker) state.userMarker.setMap(null);
            state.userMarker = new google.maps.Marker({
              position: center,
              map: state.map,
              title: "Your location"
            });
          }

          runSearch({ center });
          useLocationButton.disabled = false;
        },
        function () {
          if (status) status.textContent = "Location permission was not granted. Showing Noida / Delhi NCR instead.";
          useLocationButton.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  window.initZuppioStoreLocatorMap = function () {
    if (!mapCanvas || !window.google || !google.maps) return;

    state.map = new google.maps.Map(mapCanvas, {
      center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
      zoom: defaultCenter.zoom || 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#170b24" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#f6e8ff" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#12051c" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#36254a" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffdc63" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d2231" }] }
      ]
    });
    state.geocoder = new google.maps.Geocoder();
    state.infoWindow = new google.maps.InfoWindow();
    setFallback("", "", false);
    runSearch();
  };

  setupTabs();
  hydrateFiltersFromUrl();
  setTopMapsLink(mapConfig.defaultQuery ? `ZUPPIO Snacks near ${mapConfig.defaultQuery}` : "ZUPPIO Snacks near Noida Delhi NCR");

  if (!config.apiKeyConfigured) {
    setFallback(apiMissingMessage, "Store cards still work. Add GOOGLE_MAPS_API_KEY in .env to enable the live map.", true);
  } else {
    window.setTimeout(function () {
      if (!state.map) setFallback("Map is still loading.", "Store cards below are available while the map loads.", true);
    }, 5000);
  }

  runSearch();
})();
