API_URL = "http://localhost:3000"

const PDP = {
    selectedPlanId: null,

    async init({variantReferenceId, merchantId, addToCartButtonClass, buyItNowButtonClass, prestashopCartId, parentEstalyComponentClass}) {
        if (!variantReferenceId) {
            return
        }

        console.log(parentEstalyComponentClass);
        this.customEstalyComponentPlacementIfNeeded(parentEstalyComponentClass);

        const data = await Estaly.getOffers(variantReferenceId, merchantId);
        const combinationReferenceId = data.variantReferenceId;
        const offers = data.offers;
        const relevantOffer = offers.filter((offer) => offer.productVariantId === combinationReferenceId)[0];
        const plans = relevantOffer.plans;

        this.insertPlans(plans);
        this.fillButtonsMarketing(data.marketing.buttons);
        this.initButtons(combinationReferenceId, addToCartButtonClass, buyItNowButtonClass, prestashopCartId);
        this.displayButtons();

        //Estaly.fillModalMarketing(data.marketing.modal);
        //Estaly.initModal({ afterAddToCartCallback: () => {}}, combinationReferenceId);

        return this;
    },

    customEstalyComponentPlacementIfNeeded(parentEstalyComponentClass) {
        if (parentEstalyComponentClass){
            const parentComponent = document.getElementsByClassName(parentEstalyComponentClass)[0];
            const estalyComponent = document.getElementsByClassName("estaly-pdp-offering")[0];
            parentComponent.appendChild(estalyComponent);
        }
    },

    setButtonsState(parentClass = "") {
        const offerButtons = document.querySelectorAll(`${parentClass} .estaly-offer-button`);
        offerButtons.forEach((offerButton) => {
            if (offerButton.dataset.planVariantId === this.selectedPlanId) {
                offerButton.classList.add("active");
            } else {
                offerButton.classList.remove("active");
            }
        })
    },

    removeButtonsState() {
        const offerButtons = document.querySelectorAll(`.estaly-offer-button`);
        offerButtons.forEach((offerButton) => {
            offerButton.classList.remove("active");
        })
    },

    fillButtonsMarketing(buttonsMarketingDetails) {
        const buttons = document.querySelector(".estaly-pdp-offering")

        if (buttons) {
            buttons.querySelector(".estaly-headline-buttons").innerText = buttonsMarketingDetails.headline
            buttons.querySelector(".estaly-link-buttons").innerText = buttonsMarketingDetails.linkText
        }
    },

    initButtons(variantReferenceId, addToCartButtonClass, buyItNowButtonClass, prestashopCartId) {
        const offerButtons = document.querySelectorAll(".estaly-offer-button")
        offerButtons.forEach((offerButton) => {
            offerButton.addEventListener("click", () => {
                if (offerButton.dataset.planVariantId === this.selectedPlanId) {
                    this.selectedPlanId = null;
                } else {
                    this.selectedPlanId = offerButton.dataset.planVariantId;
                }
                this.setButtonsState();
            })
        })

        const learnMoreButton = document.querySelector(".estaly-link-buttons");
        learnMoreButton.addEventListener("click", () => {
            Estaly.openModal(false);
        })

        const addToCartButton = document.getElementsByClassName(addToCartButtonClass)[0];
        addToCartButton.addEventListener("click", () => {
            if (this.selectedPlanId == null) {
            } else {
                console.log(variantReferenceId)
                this.addOfferToCart(variantReferenceId, prestashopCartId);
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
            const protectMyPurchaseButton = document.querySelector(".estaly-modal-dialog .estaly-button-submit")
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

            const closeModalButton = document.querySelector(".estaly-modal-dialog .estaly-close")
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

    async insertPlans(plans) {
        if (plans.length === 0) {
            return
        }

        const offerButtons = document.querySelectorAll(".estaly-offer-button")
        offerButtons.forEach((offerButton, index) => {
            const plan = plans[index % plans.length]

            offerButton.dataset.planVariantId = plan.offerVariantId

            const termLengthSpan = offerButton.querySelector(".estaly-offer-term-length")
            termLengthSpan.innerText = plan.termLength

            const priceSpan = offerButton.querySelector(".estaly-offer-price")
            priceSpan.innerText = plan.price
        })
    },

    addOfferToCart(variantReferenceId, prestashopCartId) {
        if (this.selectedPlanId == null) {
            return
        }


        var static_token = $('input[name=token]').val();

        var id_product = this.selectedPlanId;

        var insurable_product_id = variantReferenceId;
        var insurance_product_id = this.selectedPlanId;
        var cart_id = prestashopCartId;


        $.ajax({
            type: 'POST',
            headers: { "cache-control": "no-cache" },
            url: prestashop.urls.pages.cart,
            async: false,
            cache: false,
            dataType : "json",
            data: {'action': 'update', 'add': 1, 'ajax': true, 'qty': 1, 'id_product': id_product, 'token': static_token},
            success: function(jsonData,textStatus,jqXHR)
            {
                // create estaly_insurance_matching
                var formData = {'ajax': 1,'cart_id': cart_id, 'insurable_product_id': insurable_product_id, 'insurance_product_id': insurance_product_id};
                $.ajax({
                    type: 'POST',
                    headers: { "cache-control": "no-cache" },
                    url: "http://localhost:8888/prestashop_1.7.8.8/module/estalymodule/insurancematching",
                    async: false,
                    cache: false,
                    dataType : "json",
                    data: formData,
                    success: function(jsonData,textStatus,jqXHR)
                    {
                    }
                });
            }
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

        const offerButtons = document.querySelectorAll(".estaly-offer-button")
        offerButtons.forEach((offerButton, index) => {
            const offer = offers[index % offers.length]

            offerButton.dataset.planVariantId = offer.offerVariantId;

            const termLengthSpan = offerButton.querySelector(".estaly-offer-term-length")
            termLengthSpan.innerText = offer.termLength

            const priceSpan = offerButton.querySelector(".estaly-offer-price")
            priceSpan.innerText = offer.price
        })
    },

    initModal({afterAddToCartCallback}, variantReferenceId) {
        const offerButtons = document.querySelectorAll(".estaly-modal-dialog .estaly-offer-button")
        offerButtons.forEach((offerButton) => {
            offerButton.addEventListener("click", () => {
                if (offerButton.dataset.planVariantId == this.state.selectedOfferId) {
                    this.state.selectedOfferId = null;
                } else {
                    this.state.selectedOfferId = offerButton.dataset.planVariantId;
                }
                offerButtons.forEach((offerButton) => {
                    if (offerButton.dataset.planVariantId === this.state.selectedOfferId) {
                        offerButton.classList.add("active");
                    } else {
                        offerButton.classList.remove("active");
                    }
                })
            })
        })

        const closeModalButton = document.querySelector(".estaly-modal-dialog .estaly-close")
        closeModalButton.addEventListener("click", this.closeModal)

        const protectMyPurchaseButton = document.querySelector(".estaly-modal-dialog .estaly-button-submit")
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
        //const modal = document.querySelector(".estaly-modal-dialog")
        //if (withButtons) {
        //    modal.querySelector(".estaly-buttons-container").style.display = "block"
        //} else {
        //    modal.querySelector(".estaly-buttons-container").style.display = "none"
        //}
        //modal.style.display = "flex"
        window.open('https://customer.estaly.co/contracts-details', '_blank');
    },

    closeModal() {
        const modal = document.querySelector(".estaly-modal-dialog")
        modal.style.display = "none"
    },

    fillModalMarketing(modalMarketingDetails) {
        const modal = document.querySelector(".estaly-modal-dialog");

        if (modal) {
            modal.querySelector("h2").innerText = modalMarketingDetails.headline;
            modal.querySelector(".estaly-coverage-header").innerText = modalMarketingDetails.coverageBulletsHeading;

            const bulletPoints = modal.querySelectorAll(".estaly-list .estaly-list-item");
            bulletPoints.forEach((bulletPoint, index) => {
                bulletPoint.innerText = modalMarketingDetails.bulletPoints[index];
            })

            modal.querySelector(".estaly-terms-link").innerText = modalMarketingDetails.linkText;
            modal.querySelector(".estaly-terms-link").href = modalMarketingDetails.planDetailsUrl;
            modal.querySelector(".estaly-merchant-logo").src = modalMarketingDetails.merchantLogo;
            modal.querySelector(".estaly-button-link").innerText = modalMarketingDetails.declineText;
            modal.querySelector(".estaly-button-submit").innerText = modalMarketingDetails.buyText;
            modal.querySelector(".estaly-offered-by").innerText = modalMarketingDetails.legalText;

            const modalLearnMoreImage = modal.querySelector(".estaly-learn-more-image");
            if (modalLearnMoreImage !== undefined && modalLearnMoreImage !== null){
                modalLearnMoreImage.src = modalMarketingDetails.image;
            }
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
