void (async () => {
  const waitForSelectorToAppear = async (
    selector: string,
    within?: Element
  ): Promise<Element> => {
    let element: Element | null;
    do {
      element = (within ?? document).querySelector(selector);
      if (!element) {
        console.log(`Waiting for selector: ${selector}`);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    } while (!element);
    console.log(`Selector appeared: ${selector}`);
    return element;
  };

  const waitForSelectorToHaveSomeText = async (
    selector: string,
    within?: Element
  ): Promise<Element> => {
    let element: Element | null;
    do {
      element = (within ?? document).querySelector(selector);
      if (element?.textContent?.trim()) {
        break;
      }
      console.log(`Waiting for text in selector: ${selector}`);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    } while (!element?.textContent?.trim());
    console.log(`Selector appeared with some text: ${selector}`);
    return element;
  };

  const waitForSelectorToAppearAndHaveSomeText = async (
    selector: string,
    within?: Element
  ): Promise<Element> => {
    await waitForSelectorToAppear(selector, within);
    return waitForSelectorToHaveSomeText(selector, within);
  };

  const waitAndTryToClick = async (
    selector: string,
    within?: Element
  ): Promise<boolean> => {
    const element = await waitForSelectorToAppear(selector, within);
    if (!("click" in element) || typeof element.click !== "function") {
      // Isn't possible in theory, but just in case (TS asked for this)
      console.error(`Element is not clickable for selector: ${selector}`);
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    element.click();
    return true;
  };

  const parseNumber = (text: string) => Number(text.replace(/[^0-9.]/g, ``));

  const productCards = document.querySelectorAll(
    `.search-item-card-wrapper-gallery`
  );
  for (const card of productCards) {
    console.log(`Processing card:`, card);

    if (!(await waitAndTryToClick(`span[title="See preview"]`, card))) continue; // fixes https://github.com/Maxim-Mazurok/aliexpress-show-shipped-price/issues/4

    const productPriceElement = await waitForSelectorToAppearAndHaveSomeText(
      `.pdp-comp-price-current`
    );
    const productPrice = parseNumber(productPriceElement.textContent ?? "");

    const shippingCostElement = await waitForSelectorToAppearAndHaveSomeText(
      `.dynamic-shipping-line:first-child`
    );
    const shippingCostText = shippingCostElement.textContent ?? "";
    const shippingCost = shippingCostText.includes(`Free shipping`)
      ? 0
      : parseNumber(shippingCostText);

    if (!(await waitAndTryToClick(`button[aria-label="Close"]`))) continue; // Shouldn't happen, unless AliExpress changed something

    const productPriceLine = card.querySelector(`[class^="multi--price--"]`);
    const shippedPrice = productPrice + shippingCost;
    console.log(
      `Shipped price: $${shippedPrice.toFixed(2)} = $${productPrice.toFixed(
        2
      )} + $${shippingCost.toFixed(2)}`
    );

    if (!productPriceLine) {
      console.error(`Price line not found for card:`, card);
      continue;
    }
    productPriceLine.innerHTML = `Shipped: <b>$${shippedPrice.toFixed(2)}<b>`;
  }

  const container = document.querySelector(`#card-list`);
  if (!container) {
    console.error(`Container not found, can't sort`);
    return;
  }
  const sortedDivs = Array.from(container.children).sort((a, b) => {
    const priceTextA = a.querySelector(
      `[class^="multi--price--"]`
    )?.textContent;
    const priceTextB = b.querySelector(
      `[class^="multi--price--"]`
    )?.textContent;

    const priceA = priceTextA ? parseNumber(priceTextA) : Infinity;
    const priceB = priceTextB ? parseNumber(priceTextB) : Infinity;

    return priceA - priceB;
  });
  container.innerHTML = "";
  sortedDivs.forEach((div) => container.appendChild(div));
})();
