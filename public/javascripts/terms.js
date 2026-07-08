(function () {
  const searchInput = document.querySelector("[data-legal-search]");
  const cards = Array.from(document.querySelectorAll("[data-policy-card]"));
  const emptyMessage = document.querySelector("[data-search-empty]");

  if (!searchInput || !cards.length) return;

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCards = 0;

    cards.forEach(function (card) {
      const matches = !query || (card.dataset.searchText || "").includes(query);
      card.hidden = !matches;
      if (matches) visibleCards += 1;
    });

    if (emptyMessage) emptyMessage.hidden = visibleCards !== 0;
  });
})();
