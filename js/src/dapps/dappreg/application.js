// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component } from 'react';
import { observer } from 'mobx-react';

import Store from './store';
import styles from './application.css';

import { api } from './parity';

@observer
export default class Application extends Component {
  store = Store.instance();

  state = {
  }

  render () {
    return this.store.isLoading
      ? this.renderLoading()
      : this.renderApplication();
  }

  renderApplication () {
    return (
      <div className={ styles.body }>
        { this.renderWarning() }
        <div className={ styles.apps }>
          { this.renderAppsSelect() }
          { this.renderCurrentApp() }
          { this.renderButtons() }
        </div>
        { this.renderFooter() }
      </div>
    );
  }

  renderAppsSelect () {
    if (this.store.isNew) {
      return null;
    }

    return (
      <div>
        <label>Application, the actual application details to show below</label>
        <select
          value={ this.store.currentApp.id }
          disabled={ this.store.isEditing }
          onChange={ this.onSelectApp }>
          {
            this.store.apps.map((app) => {
              return (
                <option value={ app.id } key={ app.id }>
                  { app.name } ({ app.id })
                </option>
              );
            })
          }
        </select>
      </div>
    );
  }

  renderButtons () {
    let buttons = [];

    if (this.store.isEditing || this.store.isNew) {
      buttons = [
        <button onClick={ this.onCancelClick } key='cancel' className={ styles.cancel }>Cancel</button>,
        <button onClick={ this.onSaveClick } key='save'>Save</button>
      ];
    } else {
      buttons = [
        <button onClick={ this.onDeleteClick } key='delete' className={ styles.delete } disabled={ !this.store.currentApp.isOwner && !this.store.isContractOwner }>Delete</button>,
        <button onClick={ this.onEditClick } key='edit' disabled={ !this.store.currentApp.isOwner }>Edit</button>,
        <button onClick={ this.onNewClick } key='new'>New</button>
      ];
    }

    return (
      <div className={ styles.buttonbar }>
        { buttons }
      </div>
    );
  }

  renderCurrentApp () {
    const app = this.store.isNew || this.store.isEditing
      ? this.state
      : this.store.currentApp;
    const ownerLabel = <label>Owner, the application owner and editor</label>;

    let ownerInput;
    if (this.store.isNew) {
      ownerInput = (
        <div>
          { ownerLabel }
          <select
            value={ this.store.currentAccount.address }
            onChange={ this.onSelectAccount }>
            {
              this.store.accounts.map((account) => {
                return (
                  <option value={ account.address } key={ account.address }>
                    { account.name }
                  </option>
                );
              })
            }
          </select>
        </div>
      );
    } else {
      ownerInput = (
        <div>
          { ownerLabel }
          <input value={ app.ownerName } readOnly />
          <div className={ styles.hint }>{ app.owner }</div>
        </div>
      );
    }

    return (
      <div className={ styles.app }>
        <div className={ styles.section }>
          <div>
            <label>Application Id, the unique assigned identifier</label>
            <input value={ app.id } readOnly />
            <div className={ styles.hint }>...</div>
          </div>
          { ownerInput }
        </div>
        <div className={ styles.section }>
          <div>
            <label>Image hash, as generated by Githubhint</label>
            <input value={ app.imageHash || '' } dirty={ app.imageChanged } readOnly={ !this.store.isEditing && !this.store.isNew } error={ !!app.imageError } onChange={ this.onChangeImage } />
            <div className={ styles.hint }>{ app.imageError || app.imageUrl || '...' }</div>
          </div>
          <div>
            <label>Manifest hash, as generated by Githubhint</label>
            <input value={ app.manifestHash || '' } dirty={ app.manifestChanged } readOnly={ !this.store.isEditing && !this.store.isNew } error={ !!app.manifestError } onChange={ this.onChangeManifest } />
            <div className={ styles.hint }>{ app.manifestError || app.manifestUrl || '...' }</div>
          </div>
          <div>
            <label>Content hash, as generated by Githubhint</label>
            <input value={ app.contentHash || '' } dirty={ app.contentChanged } readOnly={ !this.store.isEditing && !this.store.isNew } error={ !!app.contentError } onChange={ this.onChangeContent } />
            <div className={ styles.hint }>{ app.contentError || app.contentUrl || '...' }</div>
          </div>
        </div>
      </div>
    );
  }

  renderFooter () {
    return (
      <div className={ styles.footer }>
        { this.store.count } applications registered, { this.store.ownedCount } owned by user
      </div>
    );
  }

  renderLoading () {
    return (
      <div className={ styles.body }>
        <div className={ styles.loading }>Loading application</div>
      </div>
    );
  }

  renderWarning () {
    return (
      <div className={ styles.warning }>
        WARNING: Registering a dapp is for developers only. Please ensure you understand the steps needed to develop and deploy applications, should you wish to use this dapp for anything apart from queries. A non-refundable fee of { api.util.fromWei(this.store.fee).toFormat(3) }<small>ETH</small> is required for any registration.
      </div>
    );
  }

  copyToState () {
    const app = this.store.currentApp;

    this.setState({
      id: this.store.isNew ? this.store.newId : app.id,
      contentChanged: false,
      contentError: null,
      contentHash: this.store.isNew ? null : app.contentHash,
      contentUrl: this.store.isNew ? null : app.contentUrl,
      imageChanged: false,
      imageError: null,
      imageHash: this.store.isNew ? null : app.imageHash,
      imageUrl: this.store.isNew ? null : app.imageUrl,
      manifestChanged: false,
      manifestError: null,
      manifestHash: this.store.isNew ? null : app.manifestHash,
      manifestUrl: this.store.isNew ? null : app.manifestUrl
    });
  }

  onSelectAccount = (event) => {
    this.store.setCurrentAccount(event.target.value);
  }

  onSelectApp = (event) => {
    this.store.setCurrentApp(event.target.value);
  }

  onChangeHash (event, type) {
    const hash = event.taget.value;
    let changed = false;
    let url = null;

    if (this.store.isNew) {
      if (hash && hash.length) {
        changed = true;
      }
    } else {
      if (this.store.currentApp[`${type}Hash`] !== hash) {
        changed = true;
      } else {
        url = this.store.currentApp[`${type}Url`];
      }
    }

    this.setState({
      [`${type}Changed`]: changed,
      [`${type}Error`]: null,
      [`${type}Hash`]: hash,
      [`${type}Url`]: changed ? 'Resolving url from hash' : url
    }, () => {
      if (changed) {
        this.store
          .lookupHash(hash)
          .then((url) => {
            this.setState({
              [`${type}Error`]: url ? null : 'Unable to resolve url',
              [`${type}Url`]: url
            });
          });
      }
    });
  }

  onChangeContent = (event) => {
    this.onChangeHash(event, 'content');
  }

  onChangeImage = (event) => {
    this.onChangeHash(event, 'image');
  }

  onChangeManifest = (event) => {
    this.onChangeHash(event, 'manifest');
  }

  onCancelClick = () => {
    if (this.store.isEditing) {
      this.store.setEditing(false);
    } else if (this.store.isNew) {
      this.store.setNew(false);
    }
  }

  onEditClick = () => {
    if (!this.store.currentApp.isOwner) {
      return;
    }

    this.store.setEditing(true);
    this.copyToState();
  }

  onNewClick = () => {
    this.store.setNew(true);
    this.copyToState();
  }

  onSaveClick = () => {
  }
}