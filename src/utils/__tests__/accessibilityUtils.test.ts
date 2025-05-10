import { describe, it, expect, vi } from 'vitest';
import {
  handleKeyboardEvent,
  buttonA11yProps,
  toggleA11yProps,
  tabA11yProps,
  tabPanelA11yProps,
  menuItemA11yProps,
  liveRegionA11yProps,
  dialogA11yProps,
  formFieldA11yProps
} from '../accessibilityUtils';

describe('Accessibility Utils', () => {
  describe('handleKeyboardEvent', () => {
    it('should call callback when Enter key is pressed', () => {
      const callback = vi.fn();
      const event = { key: 'Enter', preventDefault: vi.fn() } as any;
      
      handleKeyboardEvent(event, callback);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
    
    it('should call callback when Space key is pressed', () => {
      const callback = vi.fn();
      const event = { key: ' ', preventDefault: vi.fn() } as any;
      
      handleKeyboardEvent(event, callback);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
    
    it('should not call callback for other keys', () => {
      const callback = vi.fn();
      const event = { key: 'Tab', preventDefault: vi.fn() } as any;
      
      handleKeyboardEvent(event, callback);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('buttonA11yProps', () => {
    it('should return basic button props', () => {
      const props = buttonA11yProps('Test Button');
      
      expect(props).toEqual({
        'aria-label': 'Test Button',
        'role': 'button',
        'tabIndex': 0
      });
    });
    
    it('should include description when provided', () => {
      const props = buttonA11yProps('Test Button', 'Button description');
      
      expect(props).toEqual({
        'aria-label': 'Test Button',
        'aria-description': 'Button description',
        'role': 'button',
        'tabIndex': 0
      });
    });
    
    it('should include expanded state when provided', () => {
      const props = buttonA11yProps('Test Button', undefined, true);
      
      expect(props).toEqual({
        'aria-label': 'Test Button',
        'aria-expanded': true,
        'role': 'button',
        'tabIndex': 0
      });
    });
    
    it('should include controls when provided', () => {
      const props = buttonA11yProps('Test Button', undefined, undefined, 'content-id');
      
      expect(props).toEqual({
        'aria-label': 'Test Button',
        'aria-controls': 'content-id',
        'role': 'button',
        'tabIndex': 0
      });
    });
  });
  
  describe('toggleA11yProps', () => {
    it('should return toggle props with pressed state', () => {
      const props = toggleA11yProps('Test Toggle', true);
      
      expect(props).toEqual({
        'aria-label': 'Test Toggle',
        'aria-pressed': true,
        'role': 'switch',
        'tabIndex': 0
      });
    });
    
    it('should include controls when provided', () => {
      const props = toggleA11yProps('Test Toggle', false, 'content-id');
      
      expect(props).toEqual({
        'aria-label': 'Test Toggle',
        'aria-pressed': false,
        'aria-controls': 'content-id',
        'role': 'switch',
        'tabIndex': 0
      });
    });
  });
  
  describe('tabA11yProps', () => {
    it('should return tab props with selected state', () => {
      const props = tabA11yProps('Test Tab', true, 'panel-id');
      
      expect(props).toEqual({
        'aria-label': 'Test Tab',
        'aria-selected': true,
        'aria-controls': 'panel-id',
        'role': 'tab',
        'tabIndex': 0
      });
    });
    
    it('should set tabIndex to -1 when not selected', () => {
      const props = tabA11yProps('Test Tab', false, 'panel-id');
      
      expect(props).toEqual({
        'aria-label': 'Test Tab',
        'aria-selected': false,
        'aria-controls': 'panel-id',
        'role': 'tab',
        'tabIndex': -1
      });
    });
  });
  
  describe('tabPanelA11yProps', () => {
    it('should return tab panel props', () => {
      const props = tabPanelA11yProps('tab-id');
      
      expect(props).toEqual({
        'aria-labelledby': 'tab-id',
        'role': 'tabpanel',
        'tabIndex': 0
      });
    });
  });
  
  describe('menuItemA11yProps', () => {
    it('should return menu item props', () => {
      const props = menuItemA11yProps('Test Menu Item');
      
      expect(props).toEqual({
        'aria-label': 'Test Menu Item',
        'role': 'menuitem',
        'tabIndex': 0
      });
    });
    
    it('should include disabled state when provided', () => {
      const props = menuItemA11yProps('Test Menu Item', true);
      
      expect(props).toEqual({
        'aria-label': 'Test Menu Item',
        'aria-disabled': true,
        'role': 'menuitem',
        'tabIndex': -1
      });
    });
  });
  
  describe('liveRegionA11yProps', () => {
    it('should return live region props with defaults', () => {
      const props = liveRegionA11yProps();
      
      expect(props).toEqual({
        'aria-live': 'polite',
        'aria-atomic': true,
        'aria-relevant': 'additions',
        'aria-busy': false
      });
    });
    
    it('should allow customizing atomic, relevant, and busy', () => {
      const props = liveRegionA11yProps(false, 'all', true);
      
      expect(props).toEqual({
        'aria-live': 'polite',
        'aria-atomic': false,
        'aria-relevant': 'all',
        'aria-busy': true
      });
    });
  });
  
  describe('dialogA11yProps', () => {
    it('should return dialog props with defaults', () => {
      const props = dialogA11yProps('Test Dialog');
      
      expect(props).toEqual({
        'aria-label': 'Test Dialog',
        'role': 'dialog',
        'aria-modal': true
      });
    });
    
    it('should include description when provided', () => {
      const props = dialogA11yProps('Test Dialog', 'Dialog description');
      
      expect(props).toEqual({
        'aria-label': 'Test Dialog',
        'aria-description': 'Dialog description',
        'role': 'dialog',
        'aria-modal': true
      });
    });
    
    it('should use alertdialog role when not modal', () => {
      const props = dialogA11yProps('Test Dialog', undefined, false);
      
      expect(props).toEqual({
        'aria-label': 'Test Dialog',
        'role': 'alertdialog',
        'aria-modal': false
      });
    });
  });
  
  describe('formFieldA11yProps', () => {
    it('should return form field props with label', () => {
      const props = formFieldA11yProps('Test Field');
      
      expect(props).toEqual({
        'aria-label': 'Test Field'
      });
    });
    
    it('should include required state when provided', () => {
      const props = formFieldA11yProps('Test Field', true);
      
      expect(props).toEqual({
        'aria-label': 'Test Field',
        'aria-required': true
      });
    });
    
    it('should include invalid state when provided', () => {
      const props = formFieldA11yProps('Test Field', false, true);
      
      expect(props).toEqual({
        'aria-label': 'Test Field',
        'aria-invalid': true
      });
    });
    
    it('should include error message when invalid', () => {
      const props = formFieldA11yProps('Test Field', false, true, 'Field is required');
      
      expect(props).toEqual({
        'aria-label': 'Test Field',
        'aria-invalid': true,
        'aria-errormessage': 'Field is required'
      });
    });
    
    it('should include describedBy when provided', () => {
      const props = formFieldA11yProps('Test Field', false, false, undefined, 'field-description');
      
      expect(props).toEqual({
        'aria-label': 'Test Field',
        'aria-describedby': 'field-description'
      });
    });
    
    it('should include all props when provided', () => {
      const props = formFieldA11yProps('Test Field', true, true, 'Field is required', 'field-description');
      
      expect(props).toEqual({
        'aria-label': 'Test Field',
        'aria-required': true,
        'aria-invalid': true,
        'aria-errormessage': 'Field is required',
        'aria-describedby': 'field-description'
      });
    });
  });
});
