import {Registry, initializeTrrack} from 'https://cdn.jsdelivr.net/npm/@trrack/core@1.3.0/+esm'

        const initialState = {
            selectedButton: 'page1'
        };

        const registry = Registry.create();

        const clickButton = registry.register(
            'click-button',
            (state, task) => {
                state.selectedButton = task;
                return state;
            }
        );

        const trrack = initializeTrrack({
            initialState,
            registry
        });

        window.showContent = function(page, button, buttonId) {
            document.querySelectorAll('.content').forEach(div => div.style.display = 'none');
            document.getElementById(page).style.display = 'block';
            document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            console.log('Button ID:', buttonId);

            trrack.apply('Click button', clickButton(buttonId));

            // Save the current state to ReVISit
            saveToReVISit();
        }

        trrack.currentChange(() => {
            const selectedButton = trrack.getState().selectedButton;
            document.querySelectorAll('.tab').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('onclick').includes(selectedButton));
            });
            document.querySelectorAll('.content').forEach(div => {
                div.style.display = div.id === selectedButton ? 'block' : 'none';
            });

            // Save the current state to ReVISit
            saveToReVISit();
        });

        function saveToReVISit() {
            Revisit.postAnswers({
                selectedButton: trrack.getState().selectedButton
            });
            Revisit.postProvenance(trrack.graph.backend);
        }

        // Call saveToReVISit when the page is about to unload (e.g., when closing the tab)
        window.addEventListener('beforeunload', saveToReVISit);