/* This is a custom validator service for Angular if you are using formcontrols. */
/* In order to use custom validators, you can just add it in the Validators list: 
* this.email = new FormControl('', [Validators.required, CustomValidatorService.emailValidator]);
* For validators with params, just pass them like regular methods: 
* this.phoneNumber = new FormControl('', [Validators.required, CustomValidatorService.phoneNumberValidator(5, 11)]);
*/

import { Injectable, OnInit } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class FormcontrolValidatorsService implements OnInit {
  static emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  static passRegexNoSpecials = /^[a-zA-Z 0-9]([a-zA-Z 0-9])*[a-zA-z 0-9]$/;
  static nameRegex = /^[a-zA-Z]([a-zA-Z .])*[a-zA-z]$/;
  constructor(){ }

  ngOnInit() { }

  static emailValidator (fCtrl: AbstractControl): {[key: string]: boolean} | null {
    if(fCtrl.value !== undefined && !FormcontrolValidatorsService.emailRegex.test(fCtrl.value)){
      return { 'email': true };
    }
    return null;
  }

  static phoneNumberValidator (minLen: number, maxLen: number): ValidatorFn {
    return function (fCtrl: AbstractControl): {[key: string] : boolean} | null {
      if(fCtrl.value !== undefined ){
        if(isNaN(fCtrl.value)){
          return { 'isNaN': true };
        } else if ( !maxLen && fCtrl.value.length < minLen) { // To be used when there is a min length restriction. Just call validator with maxLen null.
          return { 'minLength': true };
        } else if ( maxLen && (fCtrl.value.length < minLen || fCtrl.value.length > maxLen)) { // To be used when there is length range restriction.
          return { 'phoneRange': true };
        }
      }
      return null;
    };
  }

  static passwordValidator (minLen: number, allowSpecialChars: boolean): ValidatorFn {
    return function (fCtrl: AbstractControl): {[key: string]: boolean} | null {
      if(fCtrl.value !== undefined) {
        if(!allowSpecialChars && !FormcontrolValidatorsService.passRegexNoSpecials.test(fCtrl.value)){ // To be used when special characters are not allowed in passwords.
          return { 'specialChars': true };
        } else if (fCtrl.value.length < minLen) {
          return { 'minLength': true };
        }
      }
      return null;
    }
  }

  static nameValidator (fCtrl: AbstractControl) : {[key : string]: boolean} | null {
    if(fCtrl.value !== undefined && !FormcontrolValidatorsService.nameRegex.test(fCtrl.value)){
      return { 'name': true };
    }
    return null;
  }
}
