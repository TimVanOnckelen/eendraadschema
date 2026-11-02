type ListenerTarget = HTMLElement | Document | Window;

/**
 * Manages the addition and removal of event listeners on HTML elements.
 */
export class EventManager {
    private listeners: {
        element: ListenerTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions
    }[] = [];

    /**
     * Adds an event listener to a specified HTML element. If a listener of the same
     * type (and same capture phase) already exists on the element, it is removed before adding the new one.
     *
     * @param element - The HTML element (or document/window) to attach the event listener to.
     * @param type - The type of the event.
     * @param listener - The event listener function or object.
     * @param options - Optional addEventListener options (capture, passive, ...).
     */
    addEventListener(
        element: ListenerTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | ((event: any) => void),
        options?: AddEventListenerOptions
    ) {
        const capture = !!options?.capture;
        const existingListenerIndex = this.listeners.findIndex(
            l => l.element === element && l.type === type && !!l.options?.capture === capture
        );
        if (existingListenerIndex !== -1) {
            const existingListener = this.listeners[existingListenerIndex];
            element.removeEventListener(type, existingListener.listener, existingListener.options);
            this.listeners.splice(existingListenerIndex, 1);
        }

        this.listeners.push({ element, type, listener: listener as EventListenerOrEventListenerObject, options });
        element.addEventListener(type, listener as EventListenerOrEventListenerObject, options);

        this.cleanup(); // Before we proceed, remove all listeners for elements that no longer exist
    }

    /**
     * Removes all event listeners managed by this EventManager instance.
     */
    removeAllEventListeners() {
        this.listeners.forEach(({ element, type, listener, options }) => {
            element.removeEventListener(type, listener, options);
        });
        this.listeners = [];
    }

    /**
     * Disposes of the EventManager by removing all event listeners.
     */
    dispose() {
        this.removeAllEventListeners();
    }

    /**
     * Removes all listeners for which the HTML element no longer exists.
     */
    cleanup() {
        this.listeners = this.listeners.filter(({ element, type, listener, options }) => {
            if (element instanceof Node && !(element instanceof Document) && !document.contains(element)) {
                element.removeEventListener(type, listener, options);
                return false;
            }
            return true;
        });
    }
}
