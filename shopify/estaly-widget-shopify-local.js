API_URL = "https://0b20-178-51-35-202.eu.ngrok.io"

CART_ITEM_SELECTOR = ".cart-item__details"

const Cart = {
    async init({cartVariantIds}) {
        const variantIds = cartVariantIds.filter(id => id);

        if (variantIds.length === 0) {
            return
        }
        const data = await Estaly.getOffers(variantIds);
        const offers = data.offers

        Estaly.fillModalMarketing(data.marketing.modal);

        this.insertSimpleOffers(offers, variantIds, data.marketing.cart)
    },

    insertSimpleOffers(offers, variantIds, cartMarketingDetails) {
        const cartItems = document.querySelectorAll(CART_ITEM_SELECTOR);
        if (cartItems.length === 0) {
            return
        }

        cartItems.forEach((cartItem, index) => {
            cartItem.dataset.variantId = variantIds[index];
        })

        offers.forEach((offer) => {
            const cartItem = document.querySelector(`[data-variant-id="${offer.productVariantId}"]`);
            if (cartItem.querySelector(".simple-offer")) {
                return
            }
            const simpleOfferNode = document.createElement("div");
            simpleOfferNode.innerHTML = `<button class='simple-offer' id='simple_offer' type='button'>${cartMarketingDetails.simpleOfferButtonText} ${offer.plans[0].price}</button>`;
            cartItem.appendChild(simpleOfferNode);
            simpleOfferNode.addEventListener("click", () => {
                Estaly.initModal({ afterAddToCartCallback: () => {
                    setTimeout(() => location.reload(), 1000);
                }},offer.productVariantId);
                Estaly.insertPlans(offer.plans);
                Estaly.openModal(true);
            })
        })
    },
}

const PDP = {
    selectedPlanId: null,

    async init({variantReferenceId, merchantId, addToCartButtonClass, buyItNowButtonClass}) {
        if (!variantReferenceId) {
            return
        }


        const data = await Estaly.getOffers(variantReferenceId, merchantId);
        const offers = data.offers;
        const relevantOffer = offers.filter((offer) => offer.productVariantId === variantReferenceId)[0];
        const plans = relevantOffer.plans;

        this.insertPlans(plans);
        this.fillButtonsMarketing(data.marketing.buttons);
        this.initButtons(variantReferenceId, addToCartButtonClass, buyItNowButtonClass);
        this.displayButtons();

        Estaly.fillModalMarketing(data.marketing.modal);
        Estaly.initModal({ afterAddToCartCallback: () => {}}, variantReferenceId);

        return this;
    },

    setButtonsState(parentClass = "") {
        const offerButtons = document.querySelectorAll(`${parentClass} .offer-button`)
        offerButtons.forEach((offerButton) => {
            if (offerButton.dataset.planVariantId == this.selectedPlanId) {
                offerButton.classList.add("active");
            } else {
                offerButton.classList.remove("active");
            }
        })
    },

    fillButtonsMarketing(buttonsMarketingDetails) {
        const buttons = document.querySelector(".estaly-pdp-offering")

        if (buttons) {
            buttons.querySelector(".headline-buttons").innerText = buttonsMarketingDetails.headline
            buttons.querySelector(".link-buttons").innerText = buttonsMarketingDetails.linkText
        }
    },

    initButtons(variantReferenceId, addToCartButtonClass, buyItNowButtonClass) {
        const offerButtons = document.querySelectorAll(".offer-button")
        offerButtons.forEach((offerButton) => {
            offerButton.addEventListener("click", () => {
                if (offerButton.dataset.planVariantId == this.selectedPlanId) {
                    this.selectedPlanId = null;
                } else {
                    this.selectedPlanId = offerButton.dataset.planVariantId;
                }
                this.setButtonsState();
            })
        })

        const learnMoreButton = document.querySelector(".link-buttons");
        learnMoreButton.addEventListener("click", () => {
            Estaly.openModal(false);
        })

        const addToCartButton = document.getElementsByClassName(addToCartButtonClass)[0];
        addToCartButton.addEventListener("click", () => {
            if (this.selectedPlanId == null) {
                Estaly.openModal(true)
            } else {
                this.addOfferToCart(variantReferenceId)
            }
        })

        function waitForElm(className) {
            return new Promise(resolve => {
                if (document.getElementsByClassName(className)[0]) {
                    return resolve(document.getElementsByClassName(className)[0]);
                }
        
                const observer = new MutationObserver(mutations => {
                    if (document.getElementsByClassName(className)[0]) {
                        resolve(document.getElementsByClassName(className)[0]);
                        observer.disconnect();
                    }
                });
        
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }

        waitForElm(buyItNowButtonClass).then((elm) => {
            elm.addEventListener("click", e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (this.selectedPlanId == null) {
                    Estaly.openModal(true);
                    initModalToCheckout(variantReferenceId);
                } else {
                    this.addOfferToCartAndRedirectToCheckout(true, variantReferenceId)
                }
            },true)
        })

        function initModalToCheckout(variantReferenceId) {
            const protectMyPurchaseButton = document.querySelector(".modal-dialog .button-submit")
            protectMyPurchaseButton.addEventListener("click", e => {
                e.preventDefault(); 
                e.stopPropagation();
                if (Estaly.state.selectedOfferId == null) {
                    PDP.addOfferToCartAndRedirectToCheckout(false, variantReferenceId);
                    Estaly.closeModal();
                    return
                } else {
                    PDP.addOfferToCartAndRedirectToCheckout(true, variantReferenceId);
                    Estaly.closeModal();
                }
            })

            const declineButton = document.getElementsByName("decline")[0]
            declineButton.addEventListener("click", e => {
                e.preventDefault();
                e.stopImmediatePropagation;
                PDP.addOfferToCartAndRedirectToCheckout(false, variantReferenceId);
                Estaly.closeModal();
                return
            })

            const closeModalButton = document.querySelector(".modal-dialog .close")
            closeModalButton.addEventListener("click", e => {
                e.preventDefault();
                e.stopImmediatePropagation;
                PDP.addOfferToCartAndRedirectToCheckout(false, variantReferenceId);
                Estaly.closeModal();
                return
            })
        }
    },

    displayButtons() {
        const offerButtonsContainer = document.querySelector(".estaly-pdp-offering");
        if (offerButtonsContainer) {
            offerButtonsContainer.style.display = "block";
        }
    },

    insertPlans(plans) {
        if (plans.length === 0) {
            return
        }

        const offerButtons = document.querySelectorAll(".offer-button")
        offerButtons.forEach((offerButton, index) => {
            const plan = plans[index % plans.length]

            offerButton.dataset.planVariantId = plan.offerVariantId

            const termLengthSpan = offerButton.querySelector(".offer-term-length")
            termLengthSpan.innerText = plan.termLength

            const priceSpan = offerButton.querySelector(".offer-price")
            priceSpan.innerText = plan.price
        })
    },

    addOfferToCart(variantReferenceId) {
        if (this.selectedPlanId == null) {
            return
        }

        if (Estaly.getSelectedVariantId()) {
            var selectedVariantId = Estaly.getSelectedVariantId;
        }
        else {
            var selectedVariantId = variantReferenceId;
        }

        const data = {
            items: [
                {
                    id: this.selectedPlanId,
                    quantity: 1,
                    properties: {
                        'VariantId': selectedVariantId
                    }
                },
            ]
        }

        jQuery.ajax({
            type: "POST",
            url: "/cart/add.js",
            data: data,
            async: false,
            cache: false,
            dataType: "json",
        });
    },

    addOfferToCartAndRedirectToCheckout(withProtection, variantReferenceId) {

        if (Estaly.getSelectedVariantId()) {
            var selectedVariantId = Estaly.getSelectedVariantId();
        }
        else {
            var selectedVariantId = variantReferenceId;
        }

        if (withProtection) {
            var data = {
                items: [
                    {
                        id: this.selectedPlanId,
                        quantity: 1,
                        properties: {
                            'VariantId': selectedVariantId
                        }
                    },
                    {
                        id: selectedVariantId,
                        quantity: 1,
                    },
                ]
            }
        } else {
            var data = {
                items: [
                    {
                        id: selectedVariantId,
                        quantity: 1,
                    },
                ]
            }
        }

        jQuery.ajax({
            type: "POST",
            url: "/cart/add.js",
            data: data,
            async: false,
            cache: false,
            dataType: "json",
            success: function(){
                window.location.href = "/checkout";
            },
        });
    }
}

const Estaly = {
    Widgets: {
        PDP: PDP,
        Cart: Cart,

        add(widget, params) {
            widget.init(params)
        }
    },

    state: {
        selectedOfferId: null
    },

    async getOffers(variantReferenceIds, merchantId) {
        const url = `${API_URL}/merchant/offers?reference_ids=${variantReferenceIds}`
        const response = await fetch(url, { headers: { Authorization: merchantId } })
        const data = await response.json()

        return data;
    },

    getSelectedVariantId() {
        if ( ShopifyAnalytics && ShopifyAnalytics.meta && ShopifyAnalytics.meta.selectedVariantId ) {
            return ShopifyAnalytics.meta.selectedVariantId;
        }
        return null;
    },

    insertPlans(offers) {
        if (offers.length === 0) {
            return
        }

        const offerButtons = document.querySelectorAll(".offer-button")
        offerButtons.forEach((offerButton, index) => {
            const offer = offers[index % offers.length]

            offerButton.dataset.planVariantId = offer.offerVariantId;

            const termLengthSpan = offerButton.querySelector(".offer-term-length")
            termLengthSpan.innerText = offer.termLength

            const priceSpan = offerButton.querySelector(".offer-price")
            priceSpan.innerText = offer.price
        })
    },

    initModal({afterAddToCartCallback}, variantReferenceId) {
        const offerButtons = document.querySelectorAll(".modal-dialog .offer-button")
        offerButtons.forEach((offerButton) => {
            offerButton.addEventListener("click", () => {
                if (offerButton.dataset.planVariantId == this.state.selectedOfferId) {
                    this.state.selectedOfferId = null;
                } else {
                    this.state.selectedOfferId = offerButton.dataset.planVariantId;
                }
                offerButtons.forEach((offerButton) => {
                    if (offerButton.dataset.planVariantId == this.state.selectedOfferId) {
                        offerButton.classList.add("active");
                    } else {
                        offerButton.classList.remove("active");
                    }
                })
            })
        })

        const closeModalButton = document.querySelector(".modal-dialog .close")
        closeModalButton.addEventListener("click", this.closeModal)

        const protectMyPurchaseButton = document.querySelector(".modal-dialog .button-submit")
        protectMyPurchaseButton.addEventListener("click", () => {
            if (this.state.selectedOfferId == null) {
                this.closeModal();
                return
            }
            this.addOfferToCart(variantReferenceId);
            this.closeModal();
            afterAddToCartCallback();
        })

        const declineButton = document.getElementsByName("decline")[0]
        declineButton.addEventListener("click", this.closeModal)
    },

    openModal(withButtons) {
        const modal = document.querySelector(".modal-dialog")
        if (withButtons) {
            modal.querySelector(".buttons-container").style.display = "block"
        } else {
            modal.querySelector(".buttons-container").style.display = "none"
        }
        modal.style.display = "flex"
    },

    closeModal() {
        const modal = document.querySelector(".modal-dialog")
        modal.style.display = "none"
    },

    fillModalMarketing(modalMarketingDetails) {
        const modal = document.querySelector(".modal-dialog");

        if (modal) {
            modal.querySelector("h2").innerText = modalMarketingDetails.headline;
            modal.querySelector(".coverage-header").innerText = modalMarketingDetails.coverageBulletsHeading;

            const bulletPoints = modal.querySelectorAll(".list .list-item");
            bulletPoints.forEach((bulletPoint, index) => {
                bulletPoint.innerText = modalMarketingDetails.bulletPoints[index];
            })

            modal.querySelector(".terms-link").innerText = modalMarketingDetails.linkText;
            modal.querySelector(".terms-link").href = modalMarketingDetails.planDetailsUrl;
            modal.querySelector(".merchant-logo").src = modalMarketingDetails.merchantLogo;
            modal.querySelector(".button-link").innerText = modalMarketingDetails.declineText;
            modal.querySelector(".button-submit").innerText = modalMarketingDetails.buyText;
            modal.querySelector(".offered-by").innerText = modalMarketingDetails.legalText;
            modal.querySelector(".learn-more-image").src = modalMarketingDetails.image;
        }
    },

    addOfferToCart(variantReferenceId) {
        if (this.state.selectedOfferId == null) {
            return
        }

        if (this.getSelectedVariantId()) {
            var selectedVariantId = this.getSelectedVariantId;
        }
        else {
            var selectedVariantId = variantReferenceId;
        }

        const data = {
            items: [
                {
                    id: this.state.selectedOfferId,
                    quantity: 1,
                    properties: {
                        'VariantId': selectedVariantId
                    }
                },
            ]
        }

        jQuery.ajax({
            type: "POST",
            url: "/cart/add.js",
            data: data,
            dataType: "json",
        });
    }
}
