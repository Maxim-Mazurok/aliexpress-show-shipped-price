# AliExpress Show Shipped Price

## Usage

NOTE: Tested on Chrome and a bit in Firefox, should work in other browsers as well

1. Open search results, like https://www.aliexpress.com/w/wholesale-rear-light-ebike.html?g=y&SearchText=rear+light+ebike
1. Scroll to the bottom of the page (to load all products)
1. Open Dev Tools and the browser console (best to use a separate window, resizing the page will cause re-rendering and shipped prices will disappear)
1. Paste the code from [`index.js`](./index.js) into the console and press Enter (you need to type `allow pasting` if this is your first time)
1. Wait for the script to finish

## How it works

1. The script will iterate over all product cards and click on the preview button
1. It will wait for the preview to load and then extract the price and shipping information
1. It will close the preview and display the price and shipping information on the product card
1. It will sort the product cards by the total price (price + shipping)

## Usage Notes

- In my experience, using default "Best Match" sorting works best, but if price sort also works for your query - it might help to find a few more good deals
- If you see products at the same shipped price - I recommend to check the store rating, age, etc. More mature stores tend to ship faster in my experience.

## Dev Notes

- Product card selector: `.search-item-card-wrapper-gallery`
- Preview selector: `span[title="See preview"]`
- Price selector: `.pdp-comp-price-current` ("AU$12.99")
- Shipping selector: `.dynamic-shipping-line:first-child` ("Free shipping " / "Shipping: AU$4.89")
- Close button selector: `button[aria-label="Close"]`
- Product price line selector: `[class^="multi--price--"]` or `[class^="us--price--"]`
- Container selector: `#card-list`
