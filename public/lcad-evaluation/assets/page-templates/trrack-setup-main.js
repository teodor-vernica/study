// trrack-setup.js
import { Registry, initializeTrrack } from 'https://cdn.jsdelivr.net/npm/@trrack/core@1.3.0/+esm';

const initialState = {
    selectedButton: 'task-description',
    selectedSubButton: null // Initialize as null to avoid tracking subtab state initially
};

let registry;
let trrack;
let clickButton;
let clickSubButton;

if (window.trrack) {
    console.log('Using existing trrack instance.');
    trrack = window.trrack;
    registry = trrack.registry;
    clickButton = registry.get('click-tab');
    clickSubButton = registry.get('click-sub-tab');
} else {
    console.log('Initializing new trrack instance.');
    registry = Registry.create();

    clickButton = registry.register(
        'click-tab',
        (state, task) => {
            state.selectedButton = task;
            state.selectedSubButton = null; // Reset subtab state when switching main tabs
            return state;
        }
    );

    clickSubButton = registry.register(
        'click-sub-tab',
        (state, task) => {
            state.selectedSubButton = task;
            return state;
        }
    );

    trrack = initializeTrrack({
        initialState,
        registry
    });

    // Attach the trrack instance to the window object
    window.trrack = trrack;
}

window.showContent = function(page, button) {
    const isSubTab = button.classList.contains('subtab');
    const parentContent = button.closest('.content');

    if (isSubTab) {
        // Handle subtab clicks
        parentContent.querySelectorAll('.subcontent').forEach(div => div.style.display = 'none');
        parentContent.querySelector(`#${page}`).style.display = 'block';
        parentContent.querySelectorAll('.subtab').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        trrack.apply('Change sub data view', clickSubButton(page));
    } else {
        // Handle main tab clicks
        document.querySelectorAll('.content').forEach(div => div.style.display = 'none');
        document.getElementById(page).style.display = 'block';
        document.querySelectorAll('.tabs > .tab').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show the default subtab if it exists
        const subTabs = document.querySelector(`#${page} .subtabs`);
        if (subTabs) {
            const defaultSubTab = subTabs.querySelector('.subtab').getAttribute('onclick').match(/'([^']+)'/)[1];
            subTabs.querySelectorAll('.subtab').forEach(btn => btn.classList.remove('active'));
            subTabs.querySelector(`.subtab[onclick*="${defaultSubTab}"]`).classList.add('active');
            document.querySelectorAll(`#${page} .subcontent`).forEach(div => div.style.display = 'none');
            document.getElementById(defaultSubTab).style.display = 'block';

            // Track the subtab state only when the main tab is active
            trrack.apply('Change sub data view', clickSubButton(defaultSubTab));
        }

        trrack.apply('Change data view', clickButton(page));
    }

    // Save the current state to ReVISit
    saveToReVISit();
}

trrack.currentChange(() => {
    const selectedButton = trrack.getState().selectedButton;
    const selectedSubButton = trrack.getState().selectedSubButton;

    document.querySelectorAll('.tabs > .tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(selectedButton));
    });

    document.querySelectorAll('.content').forEach(div => {
        div.style.display = div.id === selectedButton ? 'block' : 'none';
    });

    const subTabs = document.querySelector(`#${selectedButton} .subtabs`);
    if (subTabs) {
        subTabs.querySelectorAll('.subtab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('onclick').includes(selectedSubButton));
        });

        document.querySelectorAll(`#${selectedButton} .subcontent`).forEach(div => {
            div.style.display = div.id === selectedSubButton ? 'block' : 'none';
        });
    }

    // Save the current state to ReVISit
    saveToReVISit();
});

function saveToReVISit() {
    Revisit.postAnswers({
        selectedButton: trrack.getState().selectedButton,
        selectedSubButton: trrack.getState().selectedSubButton
    });
    Revisit.postProvenance(trrack.graph.backend);
    console.log("Saved to revisit.");
}

// Call saveToReVISit when the page is about to unload (e.g., when closing the tab)
window.addEventListener('beforeunload', saveToReVISit);
