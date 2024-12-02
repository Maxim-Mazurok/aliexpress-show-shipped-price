const waitForSelectorToAppearAndHaveSomeText = async (selector) => {
  while (!document.querySelector(selector)) {
    console.log(`Waiting for selector: ${selector}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  while (!document.querySelector(selector).textContent.trim()) {
    console.log(`Waiting for text in selector: ${selector}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  console.log(`Selector appeared: ${selector}`);
  return document.querySelector(selector);
};

const parseNumber = (text) => Number(text.replace(/[^0-9.]/g, ``));

const productCards = document.querySelectorAll(
  `.search-item-card-wrapper-gallery`
);
for (const card of productCards) {
  card.querySelector(`span[title="See preview"]`).click();

  const productPriceElement = await waitForSelectorToAppearAndHaveSomeText(
    `.pdp-comp-price-current`
  );
  const productPrice = parseNumber(productPriceElement.textContent);

  const shippingCostElement = await waitForSelectorToAppearAndHaveSomeText(
    `.dynamic-shipping-line:first-child`
  );
  const shippingCostText = shippingCostElement.textContent;
  const shippingCost = shippingCostText.includes(`Free shipping`)
    ? 0
    : parseNumber(shippingCostText);

  document.querySelector(`button[aria-label="Close"]`).click();

  const productPriceLine = card.querySelector(`[class^="multi--price--"]`);
  const shippedPrice = productPrice + shippingCost;
  productPriceLine.innerHTML = `Shipped: <b>$${shippedPrice.toFixed(2)}<b>`;
}

const container = document.querySelector(`#card-list`);
const sortedDivs = Array.from(container.children).sort((a, b) => {
  return (
    parseNumber(a.querySelector(`[class^="multi--price--"]`).textContent) -
    parseNumber(b.querySelector(`[class^="multi--price--"]`).textContent)
  );
});
container.innerHTML = "";
sortedDivs.forEach((div) => container.appendChild(div));
