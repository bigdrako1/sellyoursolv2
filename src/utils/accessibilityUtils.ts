/**
 * Accessibility utilities for improving keyboard navigation and screen reader support
 */

/**
 * Handles keyboard navigation for interactive elements
 * @param event Keyboard event
 * @param callback Function to call when Enter or Space is pressed
 */
export const handleKeyboardEvent = (
  event: React.KeyboardEvent,
  callback: () => void
): void => {
  // Handle Enter or Space key press
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

/**
 * Creates ARIA attributes for a button element
 * @param label Accessible label for the button
 * @param description Optional description for the button
 * @param expanded Whether the button controls an expanded element
 * @param controls ID of the element controlled by the button
 */
export const buttonA11yProps = (
  label: string,
  description?: string,
  expanded?: boolean,
  controls?: string
): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
    role: 'button',
    tabIndex: 0,
  };

  if (description) {
    props['aria-description'] = description;
  }

  if (expanded !== undefined) {
    props['aria-expanded'] = expanded;
  }

  if (controls) {
    props['aria-controls'] = controls;
  }

  return props;
};

/**
 * Creates ARIA attributes for a toggle element
 * @param label Accessible label for the toggle
 * @param pressed Whether the toggle is pressed/active
 * @param controls ID of the element controlled by the toggle
 */
export const toggleA11yProps = (
  label: string,
  pressed: boolean,
  controls?: string
): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
    'aria-pressed': pressed,
    role: 'switch',
    tabIndex: 0,
  };

  if (controls) {
    props['aria-controls'] = controls;
  }

  return props;
};

/**
 * Creates ARIA attributes for a tab element
 * @param label Accessible label for the tab
 * @param selected Whether the tab is selected
 * @param controls ID of the panel controlled by the tab
 */
export const tabA11yProps = (
  label: string,
  selected: boolean,
  controls: string
): Record<string, string | boolean> => {
  return {
    'aria-label': label,
    'aria-selected': selected,
    'aria-controls': controls,
    role: 'tab',
    tabIndex: selected ? 0 : -1,
  };
};

/**
 * Creates ARIA attributes for a tab panel
 * @param labelledBy ID of the tab that labels this panel
 */
export const tabPanelA11yProps = (
  labelledBy: string
): Record<string, string | boolean> => {
  return {
    'aria-labelledby': labelledBy,
    role: 'tabpanel',
    tabIndex: 0,
  };
};

/**
 * Creates ARIA attributes for a menu item
 * @param label Accessible label for the menu item
 * @param disabled Whether the menu item is disabled
 */
export const menuItemA11yProps = (
  label: string,
  disabled?: boolean
): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
    role: 'menuitem',
    tabIndex: disabled ? -1 : 0,
  };

  if (disabled) {
    props['aria-disabled'] = true;
  }

  return props;
};

/**
 * Creates ARIA attributes for a live region
 * @param atomic Whether the entire region should be considered as a whole
 * @param relevant What changes are relevant to the live region
 * @param busy Whether the live region is being updated
 */
export const liveRegionA11yProps = (
  atomic: boolean = true,
  relevant: 'additions' | 'removals' | 'text' | 'all' = 'additions',
  busy: boolean = false
): Record<string, string | boolean> => {
  return {
    'aria-live': 'polite',
    'aria-atomic': atomic,
    'aria-relevant': relevant,
    'aria-busy': busy,
  };
};

/**
 * Creates ARIA attributes for a dialog
 * @param label Accessible label for the dialog
 * @param description Optional description for the dialog
 * @param modal Whether the dialog is modal
 */
export const dialogA11yProps = (
  label: string,
  description?: string,
  modal: boolean = true
): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
    role: modal ? 'dialog' : 'alertdialog',
    'aria-modal': modal,
  };

  if (description) {
    props['aria-description'] = description;
  }

  return props;
};

/**
 * Creates ARIA attributes for a form field
 * @param label Accessible label for the field
 * @param required Whether the field is required
 * @param invalid Whether the field is invalid
 * @param errorMessage Error message for invalid fields
 * @param describedBy ID of the element that describes this field
 */
export const formFieldA11yProps = (
  label: string,
  required?: boolean,
  invalid?: boolean,
  errorMessage?: string,
  describedBy?: string
): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
  };

  if (required) {
    props['aria-required'] = true;
  }

  if (invalid) {
    props['aria-invalid'] = true;
    if (errorMessage) {
      props['aria-errormessage'] = errorMessage;
    }
  }

  if (describedBy) {
    props['aria-describedby'] = describedBy;
  }

  return props;
};
