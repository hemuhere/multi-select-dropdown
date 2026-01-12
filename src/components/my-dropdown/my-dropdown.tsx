import { Component, Host, h, Prop, State, Element, Listen, Event, EventEmitter } from '@stencil/core';

type Opt = HTMLMyDropdownOptionElement;

@Component({
  tag: 'my-dropdown',
  styleUrl: 'my-dropdown.css',
  shadow: true,
})
export class MyDropdown {
  @Element() el!: HTMLElement;

  @Prop() placeholder = 'Select...';
  @Prop() disabled = false;
  @Prop() filterable = true;
  @Prop() defaultValue: string[] = [];

  @Event() myChange!: EventEmitter<{ value: string[] }>;

  @State() open = false;
  @State() optionQuery = '';
  @State() optionIndex = -1;
  @State() selected: string[] = [];

  private input?: HTMLInputElement;

  private get opts(): Opt[] {
    return Array.from(this.el.querySelectorAll('my-dropdown-option'));
  }

  private get visible(): Opt[] {
    return this.opts.filter(o => !o.hidden);
  }

  componentDidLoad() {
    const fromMarkup = this.opts.filter(o => o.selected).map(o => o.value);
    this.selected = [...new Set([...(this.defaultValue || []), ...fromMarkup])];
    this.sync();
  }

  private sync() {
    const selectedItem = new Set(this.selected);
    const query = this.optionQuery.trim().toLowerCase();

    this.opts.forEach(o => {
      o.selected = selectedItem.has(o.value);
      const text = (o.label || o.textContent || '').toLowerCase();
      o.hidden = query ? !text.includes(query) : false;
      o.active = false;
    });

    if (this.optionIndex >= 0 && this.visible[this.optionIndex]) this.visible[this.optionIndex].active = true;
  }

  private toggle(val: string) {
    this.selected = this.selected.includes(val)
      ? this.selected.filter(v => v !== val)
      : [...this.selected, val];

    this.myChange.emit({ value: this.selected });
    this.optionQuery = this.filterable ? '' : this.optionQuery;
    this.optionIndex = -1;
    this.sync();
    this.input?.focus();
  }

  private openMenu(focus = true) {
    if (this.disabled) return;
    this.open = true;

    if (this.optionIndex < 0) {
      const v = this.visible;
      const first = v.findIndex(o => !o.disabled);
      this.optionIndex = first >= 0 ? first : -1;
      this.sync();
    }

    if (focus) setTimeout(() => this.input?.focus(), 0);
  }

  private closeMenu() {
    this.open = false;
    this.optionIndex = -1;
    this.sync();
  }

  private move(delta: number) {
    const v = this.visible;
    if (!v.length) return;

    let next = this.optionIndex;
    for (let i = 0; i < v.length; i++) {
      next = (next + delta + v.length) % v.length;
      if (!v[next].disabled) break;
    }

    this.optionIndex = next;
    this.sync();
    v[this.optionIndex]?.scrollIntoView({ block: 'nearest' });
  }

  private label(val: string) {
    const o = this.opts.find(x => x.value === val);
    return (o?.label || o?.textContent || val).trim();
  }

  @Listen('optionSelect')
  onOptionSelect(e: CustomEvent<{ value: string }>) {
    e.stopPropagation();
    this.openMenu(false);
    this.toggle(e.detail.value);
  }

  @Listen('mousedown', { target: 'window' })
  onOutsideDown(e: MouseEvent) {
    if (!this.open) return;
    const path = (e.composedPath?.() || []) as EventTarget[];
    if (!path.includes(this.el)) this.closeMenu();
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.disabled) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!this.open) return this.openMenu();
      const v = this.visible[this.optionIndex];
      return v ? this.toggle(v.value) : this.closeMenu();
    }

    if (e.key === ' ' && this.open) {
      e.preventDefault();
      const v = this.visible[this.optionIndex];
      if (v) this.toggle(v.value);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.open) return this.openMenu();
      return this.move(+1);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.open) return this.openMenu();
      return this.move(-1);
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      return this.closeMenu();
    }

    if (e.key === 'Backspace' && !this.optionQuery && this.selected.length) {
      e.preventDefault();
      this.toggle(this.selected[this.selected.length - 1]);
    }
  };

  render() {
    return (
      <Host class={{ open: this.open, disabled: this.disabled }} onKeyDown={this.onKey}>
        <div
          class="control"
          part="control"
          role="combobox"
          aria-expanded={this.open ? 'true' : 'false'}
          tabIndex={this.disabled ? -1 : 0}
          onClick={() => (this.open ? this.closeMenu() : this.openMenu())}
        >
          <div class="tags" part="tags">
            {this.selected.map(v => (
              <span class="tag" part="tag">
                {this.label(v)}
                <button
                  class="tag-x"
                  part="tag-remove"
                  type="button"
                  onClick={ev => {
                    ev.stopPropagation();
                    this.toggle(v);
                  }}
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            ))}

            {this.filterable ? (
              <input
                ref={el => (this.input = el)}
                class="input"
                part="input"
                value={this.optionQuery}
                placeholder={this.selected.length ? '' : this.placeholder}
                disabled={this.disabled}
                onInput={(ev: any) => {
                  this.optionQuery = ev.target.value || '';
                  this.optionIndex = -1;
                  this.sync();
                  if (!this.open) this.openMenu(false);
                }}
              />
            ) : (
              !this.selected.length && <span class="placeholder">{this.placeholder}</span>
            )}
          </div>

          <span class="chev" part="chevron" aria-hidden="true">
            {this.open ? '▲' : '▼'}
          </span>
        </div>

        <div class="menu" part="menu" role="listbox" aria-multiselectable="true" hidden={!this.open}>
          <slot />
          {this.open && this.visible.length === 0 && (
            <div class="empty" part="no-results">
              No results
            </div>
          )}
        </div>
      </Host>
    );
  }
}
