const form = document.querySelector("[data-form]");
const createFiltersContainer = document.querySelector("[data-create-filter]");
const keyValueTemplate = document.querySelector("[data-key-value-template]");


function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true);

    const removeBtn = element.querySelector("[data-remove-btn]");
    removeBtn.addEventListener("click", (e) => {
        e.target.closest("[data-key-value-pair]").remove();
    });

    const addInlineBtn = element.querySelector("[data-add-inline-btn]");
    addInlineBtn.addEventListener("click", () => {
        const inlineElement = createInlineKeyValuePair();
        addInlineBtn.before(inlineElement);
    });

    return element;
}

function createInlineKeyValuePair() {
    const container = document.createElement('div');
    container.className = 'input-group my-2 inline-condition';

    container.innerHTML = `
        <input type="text" class="form-control" placeholder="Answer" />
        <select class="form-control" required>
          <option value="" selected disabled>Choose...</option>
          <option value="<"><</option>
          <option value="=">=</option>
          <option value=">">></option>
        </select>
        <input type="number" min="0" max="100" step="1" class="form-control" placeholder="Value" />
        <select name="operator" class="form-control">
            <option value="" selected disabled>Choose...</option>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
        </select>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeInlineCondition(this)">
            <i class="bi bi-trash"></i>
        </button>
    `;

    // Add proper styling to your icon if it is not styled by default.
    const trashIcon = container.querySelector('.bi-trash');
    trashIcon.style.color = 'red';
    trashIcon.style.outline = 'none'; // Or any other styles for the outline

    return container;
}

function removeInlineCondition(button) {
    button.closest('.inline-condition').remove();
}


function keyValuePairsToObjects(container) {
    const pairs = container.querySelectorAll("[data-key-value-pair]");
    return [...pairs].map((pair) => {
        const key = pair.querySelector("[data-key]").value;
        const value = pair.querySelector("[data-value]").value;
        const operator = pair.querySelector('[name="operator"]')?.value || "";
        const equality = pair.querySelector('[name="equality"]')?.value || "";

        if (key === "" || equality === "" || value === "") return null;
        return {key, equality, value, operator};
    }).filter(pair => pair !== null); // Filter out any nulls from incomplete inputs
}


function setNavigationHandlers() {
    // Navigation button event handlers
    $("#questions-nav-btn, #net-nav-btn, #settings-nav-btn, #icebergs-nav-btn, #impacts-nav-btn").each(function () {
        $(this).on('click', function (e) {
            e.preventDefault(); // Prevent the default action

            // Push the current state to the history stack
            history.pushState(null, null, location.href);

            // Redirect to the target page
            window.location.href = $(this).data('target');
        });
    });
}

function _main() {
    init_page().then(function () {
        setNavigationHandlers();

        document.querySelector("[data-add-create-filter-btn]")
            .addEventListener("click", () => {
                createFiltersContainer.append(createKeyValuePair());
            });

        createFiltersContainer.append(createKeyValuePair());
    }).catch(() => {
    })
}

_main();
