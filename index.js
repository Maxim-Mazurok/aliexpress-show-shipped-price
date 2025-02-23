"use strict";
void (async () => {
    const waitForSelectorToAppear = async (selector, within) => {
        let element;
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
    const waitForSelectorToHaveSomeText = async (selector, within) => {
        let element;
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
    const waitForSelectorToAppearAndHaveSomeText = async (selector, within) => {
        await waitForSelectorToAppear(selector, within);
        return waitForSelectorToHaveSomeText(selector, within);
    };
    const tryToClick = (selector, within) => {
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
    const getProductPriceLine = (card) => {
        const priceLineSelectors = [
            `[class^="multi--price--"]`,
            `[class^="us--price--"]`,
        ];
        for (const selector of priceLineSelectors) {
            const priceLine = card.querySelector(selector);
            if (priceLine)
                return priceLine;
        }
        return null;
    };
    const parseNumber = (text) => Number(text.replace(/[^0-9.]/g, ``));
    const productCards = document.querySelectorAll(`.search-item-card-wrapper-gallery`);
    for (const card of productCards) {
        console.log(`Processing card:`, card);
        if (!tryToClick(`span[title="See preview"]`, card))
            continue; // fixes https://github.com/Maxim-Mazurok/aliexpress-show-shipped-price/issues/4
        const productPriceElement = await waitForSelectorToAppearAndHaveSomeText(`.pdp-comp-price-current`);
        const productPrice = parseNumber(productPriceElement.textContent ?? "");
        const shippingCostElement = await waitForSelectorToAppearAndHaveSomeText(`.dynamic-shipping-line:first-child`);
        const shippingCostText = shippingCostElement.textContent ?? "";
        const shippingCost = shippingCostText.includes(`Free shipping`)
            ? 0
            : parseNumber(shippingCostText);
        if (!tryToClick(`button[aria-label="Close"]`))
            continue; // Shouldn't happen, unless AliExpress changed something
        const productPriceLine = getProductPriceLine(card);
        const shippedPrice = productPrice + shippingCost;
        console.log(`Shipped price: $${shippedPrice.toFixed(2)} = $${productPrice.toFixed(2)} + $${shippingCost.toFixed(2)}`);
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
        const getPriceForComparison = (element) => {
            const priceText = getProductPriceLine(element)?.textContent;
            return priceText ? parseNumber(priceText) : Infinity; // `Infinity` to put elements without price at the end of the list
        };
        return getPriceForComparison(a) - getPriceForComparison(b);
    });
    container.innerHTML = "";
    sortedDivs.forEach((div) => container.appendChild(div));
})();
