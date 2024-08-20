// trrack-setup.js for Subpage
import { Registry, initializeTrrack } from 'https://cdn.jsdelivr.net/npm/@trrack/core@1.3.0/+esm';

let trrack;
let registry;
let clickButton;

window.addEventListener('message', (event) => {
    if (event.data.type === 'trrack-state') {
        const { state, registry: serializedRegistry } = event.data;

        registry = Registry.deserialize(serializedRegistry);

        clickButton = registry.get('click-tab');

        trrack = initializeTrrack({
            initialState: state,
            registry
        });

        console.log('Received trrack setup from parent.');
    }
});

window.showContent = function(page, button) {
    document.querySelectorAll('.content').forEach(div => div.style.display = 'none');
    document.getElementById(page).style.display = 'block';
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    console.log('Button ID:', page);

    if (trrack) {
        trrack.apply('Change data view', clickButton(page));

        // Send the updated state back to the parent
        window.parent.postMessage({ type: 'update-trrack-state', state: trrack.getState() }, '*');

        // Save the current state to ReVISit
        saveToReVISit();
    }
}

function saveToReVISit() {
    if (trrack) {
        Revisit.postAnswers({
            selectedButton: trrack.getState().selectedButton
        });
        Revisit.postProvenance(trrack.graph.backend);
        console.log("Saved to revisit.");
    }
}

// Call saveToReVISit when the page is about to unload (e.g., when closing the tab)
window.addEventListener('beforeunload', saveToReVISit);
