void (async () => {
  const waitForSelectorToAppear = async (
    selector: string,
    within?: Element,
    signal?: AbortSignal
  ): Promise<Element> => {
    let element: Element | null;
    do {
      if (signal?.aborted) {
        throw new Error(`Aborted waiting for selector: ${selector}`);
      }
      element = (within ?? document).querySelector(selector);
      if (!element) {
        console.log(`Waiting for selector: ${selector}`);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    } while (!element);
    console.log(`Selector appeared: ${selector}`);
    return element;
  };

  function trySelectors(
    selectors: string[],
    element: Element
  ): Element | undefined {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found) return found;
    }
  }

  const waitForSelectorToHaveSomeText = async (
    selector: string,
    within?: Element,
    signal?: AbortSignal
  ): Promise<Element> => {
    let element: Element | null;
    do {
      if (signal?.aborted) {
        throw new Error(`Aborted waiting for text in selector: ${selector}`);
      }
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

  const waitForSelectorsToAppearAndHaveSomeText = async (
    selectors: string[],
    within?: Element
  ): Promise<Element> => {
    const abortController = new AbortController();
    const waits = selectors.map((selector) =>
      waitForSelectorToAppearAndHaveSomeText(
        selector,
        within,
        abortController.signal
      )
    );
    try {
      return await Promise.race(waits);
    } finally {
      abortController.abort();
    }
  };

  const waitForSelectorToAppearAndHaveSomeText = async (
    selector: string,
    within?: Element,
    signal?: AbortSignal
  ): Promise<Element> => {
    await waitForSelectorToAppear(selector, within, signal);
    return waitForSelectorToHaveSomeText(selector, within, signal);
  };

  const tryToClick = (selector: string, within?: Element): boolean => {
    const element = (within ?? document).querySelector(selector);
    if (!element) {
      console.error(`Element not found for selector: ${selector}`);
      return false;
    }
    if (!("click" in element) || typeof element.click !== "function") {
      // Isn't possible in theory, but just in case (TS asked for this)
      console.error(`Element is not clickable for selector: ${selector}`);
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    element.click();
    return true;
  };

  const internalPriceLineClass = `aliexpress-show-shipped-price`;
  const getProductPriceLine = (card: Element) => {
    const priceLineSelectors = [
      `.${internalPriceLineClass}`, // our internal class, used for sorting later
      `[class^="multi--price--"]`,
      `[class^="us--price--"]`,
    ];

    const tryPriceSelectors = () => trySelectors(priceLineSelectors, card);

    function tryCurrencySymbol() {
      // Find the first element with a style attribute containing "currency-symbol"
      const element = card.querySelector('[style*="currency-symbol"]');
      if (!element) return null; // If no such element is found, return null
      // Find the closest parent <div>
      return element.closest("div");
    }

    function tryPriceRegex() {
      const priceRegex = /^AU\$\d+(\.\d+)?$/;
      for (const element of card.querySelectorAll("*")) {
        if (priceRegex.test(element.textContent ?? "")) return element;
      }
    }

    for (const fn of [tryPriceSelectors, tryCurrencySymbol, tryPriceRegex]) {
      const result = fn();
      if (result) return result;
    }

    return null;
  };

  const parseNumber = (text: string) => Number(text.replace(/[^0-9.]/g, ``));

  const productCards = document.querySelectorAll(
    `.search-item-card-wrapper-gallery`
  );
  for (const card of productCards) {
    console.log(`Processing card:`, card);

    if (!tryToClick(`span[title="See preview"]`, card)) continue; // fixes https://github.com/Maxim-Mazurok/aliexpress-show-shipped-price/issues/4

    const productPriceElement = await waitForSelectorsToAppearAndHaveSomeText([
      `.pdp-comp-price-current`,
      `[class^="price-default--current--"]`,
    ]);
    const productPrice = parseNumber(productPriceElement.textContent ?? "");

    const shippingCostElement = await waitForSelectorToAppearAndHaveSomeText(
      `.dynamic-shipping-line:first-child`
    );
    const shippingCostText = shippingCostElement.textContent ?? "";
    const shippingCost = shippingCostText.includes(`Free shipping`)
      ? 0
      : parseNumber(shippingCostText);

    if (!tryToClick(`button[aria-label="Close"]`)) continue; // Shouldn't happen, unless AliExpress changed something

    const productPriceLine = getProductPriceLine(card);
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
    productPriceLine.innerHTML = `<div class="${internalPriceLineClass}">Shipped: <b>$${shippedPrice.toFixed(
      2
    )}<b></div>`;
  }

  const container = document.querySelector(`#card-list`);
  if (!container) {
    console.error(`Container not found, can't sort`);
    return;
  }
  const sortedDivs = Array.from(container.children).sort((a, b) => {
    const getPriceForComparison = (element: Element) => {
      const priceText = getProductPriceLine(element)?.textContent;
      return priceText ? parseNumber(priceText) : Infinity; // `Infinity` to put elements without price at the end of the list
    };

    return getPriceForComparison(a) - getPriceForComparison(b);
  });
  container.innerHTML = "";
  sortedDivs.forEach((div) => container.appendChild(div));
})();
