import { Dialog } from '../documentation/Dialog';

/**
 * Styled alert dialog - replaces native alert()
 */
export function dialogAlert(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
        const dialog = new Dialog(title, message, [
            {
                text: 'OK',
                callback: () => resolve()
            }
        ]);
        dialog.show();
    });
}

/**
 * Styled confirm dialog - replaces native confirm()
 */
export function dialogConfirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
        const dialog = new Dialog(title, message, [
            {
                text: 'Annuleren',
                callback: () => resolve(false)
            },
            {
                text: 'Bevestigen',
                callback: () => resolve(true)
            }
        ]);
        dialog.show();
    });
}

/**
 * Styled prompt dialog - replaces native prompt()
 */
export function dialogPrompt(title: string, message: string, defaultValue: string = ''): Promise<string | null> {
    return new Promise((resolve) => {
        const popup = document.createElement('div');
        popup.id = 'popup';
        popup.classList.add('popup');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue;
        input.style.width = '100%';
        input.style.padding = '8px 12px';
        input.style.marginBottom = '16px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';
        input.style.fontSize = '14px';
        input.style.boxSizing = 'border-box';
        input.focus();
        
        popup.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
        popup.appendChild(input);

        const popupOverlay = document.createElement('div');
        popupOverlay.id = 'popupOverlay';
        popupOverlay.classList.add('popup-overlay');

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '0px';

        const closeDialog = () => {
            document.body.removeChild(popupOverlay);
            document.body.style.pointerEvents = 'auto';
        };

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Annuleren';
        cancelButton.classList.add('rounded-button');
        cancelButton.addEventListener('click', () => {
            closeDialog();
            resolve(null);
        });
        buttonContainer.appendChild(cancelButton);

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'OK';
        confirmButton.classList.add('rounded-button');
        confirmButton.addEventListener('click', () => {
            closeDialog();
            resolve(input.value);
        });
        buttonContainer.appendChild(confirmButton);

        // Allow pressing Enter to confirm
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                closeDialog();
                resolve(input.value);
            }
        });

        popup.appendChild(buttonContainer);
        popupOverlay.appendChild(popup);
        document.body.appendChild(popupOverlay);

        popupOverlay.style.visibility = 'visible';
        document.body.style.pointerEvents = 'none';
        popupOverlay.style.pointerEvents = 'auto';
    });
}
