//@ts-nocheck
import {useEffect, useState} from 'react';
import {gokwikConfig} from './gokwik.config';
import {CartProvider, useCart} from '@shopify/hydrogen-react';

const integrationUrls = {
  local: 'http://127.0.0.1:8080/integration.js',
  dev: 'https://dev.pdp.gokwik.co/integration.js',
  hdev: 'https://dev.pdp.gokwik.co/integration.js',
  ndev: 'https://dev.pdp.gokwik.co/integration.js',
  qa: 'https://qa.pdp.gokwik.co/integration.js',
  qatwo: 'https://qatwo.pdp.gokwik.co/integration.js',
  sandbox: 'https://sandbox.pdp.gokwik.co/integration.js',
  production: 'https://pdp.gokwik.co/integration.js',
};
export function GokwikButton(passedData) {
  const updatedCart = useCart();
  let buyNowRun = false;
  useEffect(() => {
    window.merchantInfo = {
      mid: gokwikConfig.mid,
      environment: gokwikConfig.env,
      type: 'merchantInfo',
      data: {},
    };
    const script = document.createElement('script');
    script.src = integrationUrls[window.merchantInfo.environment];
    document.body.appendChild(script);
    script.onload = () => {
      window.gokwikSdk.init();
      window.gokwikSdk &&
        window.gokwikSdk.on('modal_closed', () => {
          !buyNowRun && localStorage.removeItem('shopifyCartId');
        });
    };
  }, []);

  const triggerBuyNow = (passedData) => {
    createBuyNowCart(passedData);
  };

  const addToCart = (cart) => {
    const query = `
        mutation addItemToCart($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart {
              id}}}`;
    const variables = {
      cartId: cart.id,
      lines: {
        merchandiseId: cart?.lines[0]?.merchandise?.id,
        quantity: cart?.lines[0]?.quantity,
      },
    };
    gokwikStoreFrontApi(query, variables);
  };
  const removeFromCart = (cart) => {
    const lineIDsToRemove = [];
    const query = `
        mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    cart {
     id
    }

  }
}`;
    const variables = {
      cartId: cart.id,
      lineIds: [],
    };
    gokwikStoreFrontApi(query, variables);
  };
  const createBuyNowCart = (passedData) => {
    const query = `
	mutation createCart($cartInput: CartInput) {
  cartCreate(input: $cartInput) {
    cart {
      id
      discountAllocations {
        ... on CartAutomaticDiscountAllocation {
          title
          discountedAmount {
            currencyCode
            amount
          }
        }
      }

      discountCodes {
        applicable
        code
      }

      attributes {
        key
        value
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
      }
      totalQuantity
      note
      lines(first: 100) {
        edges {
          node {
            id
						discountAllocations{
							 ... on CartAutomaticDiscountAllocation {
								title
								discountedAmount {
									currencyCode
									amount
								}
							}
						}
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  createdAt
                  description
                  id
                  productType
                  title
                  updatedAt
                  vendor
                }
                image {
                  height
                  id
                  url
                  width
                }
                price{
                  amount
                  currencyCode
                }
                unitPrice {
                  amount
                  currencyCode
                }
              }
            }
            quantity
          }
        }
      }
    }
  }
}
`;
    const variables = {
      cartInput: {
        lines: [
          {
            quantity: passedData.quantity,
            merchandiseId: passedData.variantId,
          },
        ],
      },
    };
    gokwikStoreFrontApi(query, variables, passedData).then((res) => {
      triggerGokwikCheckout(res.data.cartCreate.cart);
    });
  };
  const getCart = async (id) => {
    const query = `
		query getCart($cartId: ID!){
    cart(id: $cartId){
      id
      discountAllocations {
        ... on CartAutomaticDiscountAllocation {
          title
          discountedAmount {
            currencyCode
            amount
          }
        }
      }

      discountCodes {
        applicable
        code
      }

      attributes {
        key
        value
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
      }
      totalQuantity
      note
      lines(first: 100) {
        edges {
          node {
            id
						discountAllocations {
							... on CartAutomaticDiscountAllocation {
								title
								discountedAmount {
									currencyCode
									amount
								}
							}
						}
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  createdAt
                  description
                  id
                  productType
                  title
                  updatedAt
                  vendor
                }
                image {
                  height
                  id
                  url
                  width
                }
                price{
                  amount
                  currencyCode
                }
                unitPrice {
                  amount
                  currencyCode
                }
              }
            }
            quantity
          }
        }
      }
    }
  }`;
    const variable = {cartId: id};
    return await gokwikStoreFrontApi(query, variable);
  };
  const gokwikStoreFrontApi = async (query, variables) => {
    return await fetch(gokwikConfig.shopifyGraphQlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': gokwikConfig.storefrontAccessToken,
      },
      body: JSON.stringify({query, variables}),
    })
      .then((response) => {
        return response.json();
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const triggerGokwikCheckout = async (cart = {}) => {
    if (cart) {
      window.merchantInfo.cart = cart;
      buyNowRun = true;
    } else {
      const apiResponse = await getCart(updatedCart.id);
      window.merchantInfo.cart = apiResponse.data
        ? apiResponse.data.cart
        : null;
      buyNowRun = false;
    }
    window.merchantInfo.cart &&
      window.gokwikSdk.initCheckout(window.merchantInfo);
  };
  return (
    <>
      {!passedData.hideButton && (
        <button
          onClick={(event) => {
            event.preventDefault();
            passedData.buyNowButton
              ? triggerBuyNow(passedData)
              : triggerGokwikCheckout();
          }}
        >
          {passedData.buyNowButton ? 'Gokwik Buy Now' : 'Pay via UPI/COD'}
        </button>
      )}
    </>
  );
}
