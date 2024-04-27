import { Component, ElementRef, ViewChild, OnInit, Renderer2, Directive, HostListener } from '@angular/core';
declare var Razorpay: any;
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from 'src/app/services/auth/admin-auth.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {

  loader: Boolean = true;
  errorMsg: string = '';
  signupForm: FormGroup;
  otpForm: FormGroup;
  classInfo: any;
  getOTP: Boolean = true;
  varifyOTP: Boolean = false;
  constructor(private fb: FormBuilder, public adminAuthService: AdminAuthService, private router: Router, private el: ElementRef, private renderer: Renderer2) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
      name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      mobile: ['', [Validators.required, Validators.pattern('^[6789]\\d{9}$')]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      state: ['', [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      pinCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      schoolName: ['', [Validators.required, Validators.maxLength(50)]],
      affiliationNumber: ['', [Validators.required, Validators.maxLength(15)]],
    });
    this.otpForm = this.fb.group({
      digit1: ['', Validators.required],
      digit2: ['', Validators.required],
      digit3: ['', Validators.required],
      digit4: ['', Validators.required],
      digit5: ['', Validators.required],
      digit6: ['', Validators.required]
    });
  }

  @HostListener('input', ['$event']) onInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const maxLength = parseInt(input.getAttribute('maxlength') || '1');
    if (input.value.length >= maxLength) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const previousInput = input.previousElementSibling as HTMLInputElement;
  
    if (event.key === 'Backspace' && !input.value) {
      if (previousInput) {
        previousInput.focus();
      }
    }
  }
  ngOnInit(): void {
    setTimeout(() => {
      this.loader = false;
    }, 1000)
  }

  signup() {
    if (this.signupForm.valid) {
      this.adminAuthService.signup(this.signupForm.value).subscribe((res: any) => {
        if (res) {
          this.getOTP = false;
          this.varifyOTP = true;
        }
      }, err => {
        this.errorMsg = err.error.errorMsg;
      })
    }
  }

  submitOtp() {
    if (this.otpForm.valid) {
      const otp = this.otpForm.value.digit1 + this.otpForm.value.digit2 + this.otpForm.value.digit3 +
        this.otpForm.value.digit4 + this.otpForm.value.digit5 + this.otpForm.value.digit6;
        console.log(otp)
    }
  }

}
