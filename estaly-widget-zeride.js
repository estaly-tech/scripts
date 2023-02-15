API_URL = "https://api.estaly.co"

OFFER_BUTTON_SELECTOR = ""
PDP_OFFERING_SELECTOR = ""
MODAL_DIALOG_SELECTOR = ""
ADD_TO_CART_CLASS_NAME = "single_add_to_cart_button button"


function openModal() {  
    const modal = document.querySelector(".modal-dialog");
    modal.style.display = "flex"; 
}

function closeModal() {
    const modal = document.querySelector(".modal-dialog");
    modal.style.display = "none";
}

const PDP = {
    selectedPlanId: null,
    async init({variantReferenceId, merchantId}) {
        if (!variantReferenceId) {
            return
        }
        const data = await Estaly.getOffers(variantReferenceId, merchantId);
        const offers = data.offers;
        const relevantOffer = offers.filter((offer) => offer.productVariantId === variantReferenceId)[0];
        const plans = relevantOffer.plans;
        this.insertPlans(plans);
        this.fillButtonsMarketing(data.marketing.buttons);
        this.initButtons(variantReferenceId);
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
    removeButtonsState() {
        const offerButtons = document.querySelectorAll(`.offer-button`);
        offerButtons.forEach((offerButton) => {
            offerButton.classList.remove("active");
        })
    },
    fillButtonsMarketing(buttonsMarketingDetails) {
        const buttons = document.querySelector(".estaly-pdp-offering")
        if (buttons) {
            buttons.querySelector(".headline-buttons").innerText = buttonsMarketingDetails.headline
            buttons.querySelector(".link-buttons").innerText = buttonsMarketingDetails.linkText
        }
    },
    initButtons(variantReferenceId) {
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
        const addToCartButton = document.getElementsByClassName(ADD_TO_CART_CLASS_NAME)[0];
        addToCartButton.estalyVariantSelected = variantReferenceId;
        addToCartButton.addEventListener("click", this.addToCartFunction);
    },
    addToCartFunction(evt) {
        console.log("VARIANTREFERENCEID");
        const variantReferenceId = evt.currentTarget.estalyVariantSelected;
        console.log(variantReferenceId);
        this.test();
        //this.addOfferToCart(variantReferenceId);
    }, 
    test() {
        console.log("TEST OK");
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
        if (this.selectedPlanId === null) {
            return
        }
        jQuery.ajax({url: '/wp/?post_type=product&add-to-cart='+this.selectedPlanId+'&productVariantId='+variantReferenceId,
            async: false
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
            modal.querySelector(".terms-link-estaly").innerText = modalMarketingDetails.linkText;
            modal.querySelector(".terms-link-estaly").href = modalMarketingDetails.planDetailsUrl;
            modal.querySelector(".merchant-logo").src = modalMarketingDetails.merchantLogo;
            modal.querySelector(".button-link").innerText = modalMarketingDetails.declineText;
            modal.querySelector(".button-submit").innerText = modalMarketingDetails.buyText;
            modal.querySelector(".offered-by").innerText = modalMarketingDetails.legalText;
            modal.querySelector(".learn-more-image").src = modalMarketingDetails.image;
        }
    },
}