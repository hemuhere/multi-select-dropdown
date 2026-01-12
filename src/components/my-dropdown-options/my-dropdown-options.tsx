import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'my-dropdown-option',
  styleUrl: './my-dropdown-options.css',
  shadow: true,
})
export class MyDropdownOption {
  @Prop() value!: string;
  @Prop() label?: string;
  @Prop({ mutable: true, reflect: true }) selected: boolean = false;
  @Prop() disabled: boolean = false;
  @Prop({ mutable: true, reflect: true }) hidden: boolean = false;
  @Prop({ mutable: true, reflect: true }) active: boolean = false;

  @Event() optionSelect!: EventEmitter<{ value: string }>;

  private onClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.disabled) return;
    this.optionSelect.emit({ value: this.value });
  };

  render() {
    return (
      <Host
        part="option"
        role="option"
        aria-selected={this.selected ? 'true' : 'false'}
        aria-disabled={this.disabled ? 'true' : 'false'}
        onClick={this.onClick}
      >
        <span class="label">
          {this.label ? this.label : <slot />}
        </span>
        <span class="check" aria-hidden="true">
          {this.selected ? '✓' : ''}
        </span>
      </Host>
    );
  }
}
