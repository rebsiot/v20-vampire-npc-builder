/* Optional Foundry-only portrait and Tokenizer 2 workflow.
 * Do not add artwork paths or layer data to the shared V20 NPC blueprint.
 */
const TOKENIZER_ID = 'tokenizer-2';

export function tokenizer2API() {
  const module = game.modules.get(TOKENIZER_ID);
  return module?.active && typeof module.api?.tokenize === 'function' ? module.api : null;
}

function imagePicker(current, selected) {
  const Picker = foundry.applications.apps.FilePicker?.implementation;
  if (!Picker) throw new Error('Foundry image picker is unavailable.');
  return new Picker({ type: 'image', current: current || '', callback: selected }).render(true);
}

function button(action, caption) {
  const el = document.createElement('button');
  el.type = 'button';
  el.dataset.v20Portrait = action;
  el.textContent = caption;
  return el;
}

export class PortraitWorkflow {
  constructor(initialPath = '') {
    this.path = initialPath || '';
    this.prepared = null;
    this.lastCreatedActor = null;
    this.createdBlueprint = null;
    this.notice = '';
    this.creating = false;
    this.root = null;
    this.currentBlueprint = null;
  }

  select(path) {
    this.path = String(path || '').trim();
    this.prepared = null;
    this.lastCreatedActor = null;
    this.createdBlueprint = null;
    this.notice = '';
    this.mount();
  }

  clear() { this.select(''); }

  setCreating(value) {
    this.creating = Boolean(value);
    this.mount();
    this.root?.querySelectorAll('[data-action="create"]').forEach(el => { el.disabled = this.creating; });
  }

  bind(root) {
    this.root = root;
    root.addEventListener('click', async event => {
      const btn = event.target.closest?.('[data-v20-portrait]');
      if (!btn || !root.contains(btn)) return;
      event.preventDefault();
      event.stopPropagation();
      if (this.creating) return;
      try {
        if (btn.dataset.v20Portrait === 'choose') {
          await imagePicker(this.path, path => { if (path) this.select(path); });
        } else if (btn.dataset.v20Portrait === 'remove') {
          this.clear();
        } else if (btn.dataset.v20Portrait === 'edit') {
          await this.editToken();
        }
      } catch (error) {
        console.error('v20-vampire-npc-builder | Portrait action failed', error);
        ui.notifications.error('Portrait action failed: ' + error.message);
      }
    });
    this.mount();
  }

  onBlueprintChange(blueprint) {
    this.currentBlueprint = blueprint;
    // A changed draft is a new NPC, not the Actor created from its prior state.
    if (this.createdBlueprint && this.createdBlueprint !== JSON.stringify(blueprint)) {
      this.lastCreatedActor = null;
      this.createdBlueprint = null;
    }
    this.mount();
  }

  async editToken() {
    const api = tokenizer2API();
    if (!api) throw new Error('Enable Tokenizer 2 to edit this token.');
    if (this.lastCreatedActor && typeof api.openEditor === 'function') {
      await api.openEditor(this.lastCreatedActor);
      this.notice = 'Token editing opened for ' + this.lastCreatedActor.name + '.';
      this.mount();
      return;
    }
    if (!this.path) throw new Error('Choose a portrait before editing its token.');
    if (typeof api.openEditorStandalone !== 'function') throw new Error('This Tokenizer 2 version does not support pre-creation editing.');
    const options = {
      name: this.currentBlueprint?.identity?.name?.trim() || 'Vampire NPC',
      type: 'npc',
      sourceImage: this.path,
    };
    if (this.prepared?.layerStack) options.layerStack = this.prepared.layerStack;
    const result = await api.openEditorStandalone(options);
    // Cancel keeps any earlier saved design, rather than discarding it.
    if (result) {
      if (!result.prototypeToken && !result.tokenPath) throw new Error('Tokenizer 2 did not return a token image.');
      this.prepared = result;
      this.notice = 'Token design saved. Create the NPC to attach it.';
    }
    this.mount();
  }

  async applyToActor(actor) {
    if (!this.path) return 'none';
    // Assign portrait only after core character creation has succeeded. Artwork
    // errors never roll back, delete, or invalidate a successfully made NPC.
    try {
      await actor.update({ img: this.path });
    } catch (error) {
      console.error('v20-vampire-npc-builder | Actor portrait failed', error);
      ui.notifications.warn('NPC created, but the portrait could not be assigned: ' + error.message);
      this.notice = 'Actor created; portrait assignment failed.';
      return 'portrait-error';
    }
    if (this.prepared) {
      try {
        const { prototypeToken, avatarUpdate, tokenPath, layerStack } = this.prepared;
        const patch = { ...(prototypeToken || {}), ...(avatarUpdate || {}) };
        if (!Object.hasOwn(patch, 'prototypeToken.texture.src') && tokenPath) {
          patch['prototypeToken.texture.src'] = tokenPath;
        }
        await actor.update(patch);
        if (layerStack) await actor.setFlag(TOKENIZER_ID, 'layerStack', layerStack);
        this.notice = 'Custom token assigned. Use Adjust Token to refine the result.';
        return 'custom';
      } catch (error) {
        console.error('v20-vampire-npc-builder | Prepared token failed', error);
        ui.notifications.warn('NPC portrait assigned, but its custom token could not be applied: ' + error.message);
        this.notice = 'Actor portrait assigned; custom token failed.';
        return 'token-error';
      }
    }
    const api = tokenizer2API();
    if (!api) {
      ui.notifications.warn('NPC portrait assigned. Tokenizer 2 is not active; no token was generated.');
      this.notice = 'Actor portrait assigned; Tokenizer 2 is unavailable.';
      return 'unavailable';
    }
    try {
      // Force the new portrait as the input, rather than the default mystery token.
      await api.tokenize(actor, { useActorImg: true });
      this.notice = 'Portrait and generated token assigned. Adjust in Tokenizer 2 if needed.';
      return 'automatic';
    } catch (error) {
      console.error('v20-vampire-npc-builder | Automatic token failed', error);
      ui.notifications.warn('NPC portrait assigned, but Tokenizer 2 could not generate a token: ' + error.message);
      this.notice = 'Actor portrait assigned; automatic token generation failed.';
      return 'token-error';
    }
  }

  markCreated(actor, blueprint) {
    this.lastCreatedActor = actor;
    this.createdBlueprint = JSON.stringify(blueprint);
    this.mount();
  }

  mount() {
    if (!this.root) return;
    this.root.querySelector('.v20-portrait-panel')?.remove();
    const identity = this.root.querySelector('.v20-body > .v20-panel');
    if (!identity) return;
    const active = tokenizer2API();
    const panel = document.createElement('section');
    panel.className = 'v20-panel v20-portrait-panel';
    const header = document.createElement('div');
    header.className = 'v20-panel-header';
    const h = document.createElement('h2');
    h.textContent = 'Portrait & Token (Optional)';
    const description = document.createElement('p');
    description.textContent = 'Choose an existing Foundry image or upload a portrait. Creating an NPC never requires artwork.';
    header.append(h, description);
    const content = document.createElement('div');
    content.className = 'v20-portrait-content';
    const preview = document.createElement('div');
    preview.className = 'v20-portrait-preview';
    if (this.path) {
      const img = document.createElement('img');
      img.alt = 'Selected NPC portrait';
      img.src = this.path;
      preview.append(img);
    } else {
      preview.classList.add('v20-portrait-empty');
      preview.textContent = 'No portrait';
    }
    const details = document.createElement('div');
    details.className = 'v20-portrait-details';
    const actions = document.createElement('div');
    actions.className = 'v20-actions v20-portrait-actions';
    const choose = button('choose', this.path ? 'Change / Upload Portrait' : 'Choose / Upload Portrait');
    const remove = button('remove', 'Remove Portrait');
    remove.hidden = !this.path;
    const edit = button('edit', this.lastCreatedActor ? 'Adjust Created Token' : 'Edit Token in Tokenizer 2');
    edit.hidden = !active || !this.path;
    edit.disabled = !this.lastCreatedActor && typeof active?.openEditorStandalone !== 'function';
    for (const control of [choose, remove, edit]) control.disabled ||= this.creating;
    actions.append(choose, remove, edit);
    const status = document.createElement('p');
    status.className = 'v20-hint v20-portrait-status';
    if (this.notice) status.textContent = this.notice;
    else if (!this.path) status.textContent = 'No artwork selected: the Actor and its default token will be created normally.';
    else if (this.prepared) status.textContent = 'Custom token ready; the saved Tokenizer 2 design will be applied during Actor creation.';
    else if (active) status.textContent = 'When you create the NPC, Tokenizer 2 will automatically generate its token. Editing is optional.';
    else status.textContent = 'The Actor portrait will be assigned; token generation requires Tokenizer 2 to be enabled.';
    details.append(actions, status);
    if (this.path) {
      const imageName = document.createElement('div');
      imageName.className = 'v20-portrait-path';
      imageName.textContent = this.path;
      imageName.title = this.path;
      details.append(imageName);
    }
    if (this.prepared?.tokenPath) {
      const thumb = document.createElement('img');
      thumb.className = 'v20-portrait-token-preview';
      thumb.src = this.prepared.tokenPath;
      thumb.alt = 'Prepared token preview';
      details.append(thumb);
    }
    content.append(preview, details);
    panel.append(header, content);
    identity.after(panel);
    this.root.querySelectorAll('[data-action="create"]').forEach(el => { el.disabled = this.creating; });
  }
}
