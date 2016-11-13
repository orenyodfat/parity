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

import { action, observable, transaction } from 'mobx';

import { trackRequest } from './parity';
import DappsStore from './dappsStore';

let instance = null;

export default class ModalStore {
  @observable errorDelete = null;
  @observable errorRegister = null;
  @observable errorUpdate = null;
  @observable stepDelete = 0;
  @observable stepRegister = 0;
  @observable stepUpdate = 0;
  @observable showingDelete = false;
  @observable showingRegister = false;
  @observable showingUpdate = false;

  _dappsStore = DappsStore.instance();

  static instance () {
    if (!instance) {
      instance = new ModalStore();
    }

    return instance;
  }

  @action setDeleteError (error) {
    transaction(() => {
      this.setDeleteStep(0);
      this.errorDelete = error;
    });
  }

  @action setDeleteStep (step) {
    this.stepDelete = step;
  }

  @action showDelete () {
    transaction(() => {
      this.setDeleteStep(1);
      this.errorDelete = null;
      this.showingDelete = true;
    });
  }

  @action hideDelete () {
    this.showingDelete = false;
  }

  @action setRegisterError (error) {
    transaction(() => {
      this.setRegisterStep(0);
      this.errorRegister = error;
    });
  }

  @action setRegisterStep (step) {
    this.stepRegister = step;
  }

  @action showRegister () {
    transaction(() => {
      this.setRegisterStep(1);
      this.errorRegister = null;
      this.showingRegister = true;
    });
  }

  @action hideRegister () {
    transaction(() => {
      this._dappsStore.setEditing(false);
      this._dappsStore.setNew(false);
      this.showingRegister = false;
    });
  }

  @action setUpdateError (error) {
    transaction(() => {
      this.setUpdateStep(0);
      this.errorUpdate = error;
    });
  }

  @action setUpdateStep (step) {
    this.stepUpdate = step;
  }

  @action showUpdate () {
    transaction(() => {
      this.setUpdateStep(1);
      this.errorUpdate = null;
      this.showingUpdate = true;
    });
  }

  @action hideUpdate () {
    transaction(() => {
      this._dappsStore.setEditing(false);
      this._dappsStore.setNew(false);
      this.showingUpdate = false;
    });
  }

  doDelete () {
    this.setDeleteStep(2);

    const appId = this._dappsStore.currentApp.id;
    const values = [appId];
    const options = {
      from: this._dappsStore.currentApp.isOwner ? this._dappsStore.currentApp.owner : this._dappsStore.contractOwner
    };

    console.log('ModalStore:doDelete', `performing deletion for ${appId} from ${options.from}`);

    this._dappsStore._instanceReg
      .unregister.estimateGas(options, values)
      .then((gas) => {
        const newGas = gas.mul(1.2);

        console.log('ModalStore:doDelete', `gas estimated as ${gas.toFormat(0)}, setting to ${newGas.toFormat(0)}`);

        options.gas = newGas.toFixed(0);

        const request = this._dappsStore._instanceReg.unregister.postTransaction(options, values);
        const statusCallback = (error, status) => {
          if (error) {
          } else if (status.signerRequestId) {
          } else if (status.transactionHash) {
            this.setDeleteStep(3);
          } else if (status.transactionReceipt) {
            this.setDeleteStep(4);
            this._dappsStore.removeApp(appId);
          }
        };

        return trackRequest(request, statusCallback);
      })
      .catch((error) => {
        console.error('ModalStore:doDelete', error);
        this.setDeleteError(error);
      });
  }

  doRegister () {
    this.setRegisterStep(2);

    const appId = this._dappsStore.wipApp.id;
    const values = [appId];
    const options = {
      from: this._dappsStore.currentAccount.address,
      value: this._dappsStore.fee
    };

    console.log('ModalStore:doRegister', `performing registration for ${appId} from ${this._dappsStore.currentAccount.address}`);

    this._dappsStore._instanceReg
      .register.estimateGas(options, values)
      .then((gas) => {
        const newGas = gas.mul(1.2);

        console.log('ModalStore:doRegister', `gas estimated as ${gas.toFormat(0)}, setting to ${newGas.toFormat(0)}`);

        options.gas = newGas.toFixed(0);

        const request = this._dappsStore._instanceReg.register.postTransaction(options, values);
        const statusCallback = (error, status) => {
          if (error) {
          } else if (status.signerRequestId) {
          } else if (status.transactionHash) {
            this.setRegisterStep(3);
          } else if (status.transactionReceipt) {
            this.setRegisterStep(4);
            this._dappsStore.addApp(appId, this._dappsStore.currentAccount);
          }
        };

        return trackRequest(request, statusCallback);
      })
      .catch((error) => {
        console.error('ModalStore:doRegister', error);
        this.setRegisterError(error);
      });
  }
}
