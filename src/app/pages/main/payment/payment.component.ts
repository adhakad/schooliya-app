import { Component, ElementRef, ViewChild, OnInit,Renderer2 } from '@angular/core';
declare var Razorpay: any;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {

  loader: Boolean = true;
  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.loader = false;
    }, 1000)
  }

}
