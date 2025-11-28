import {React, useRef} from "react";
import "./refTwo.css"
import html2pdf from "html2pdf.js";
import Preview from "../../Components/Preview";

export default function RefTwo(){
  const invoiceRef = useRef();

  const handleDownload = () => {
    const element = invoiceRef.current;
    const options = {
      margin: 0,
      filename: 'invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: [8.2, 10.99], orientation: 'portrait' }
    };

    html2pdf()
      .from(element)
      .set(options)
      .save();
  };

    return(
        <>
        <Preview title="PREVIEW REFUND FORM"/>
           <div ref={invoiceRef} className="invoice">
        <div className="top"></div>
        <div className="outer-pad">
          <div className="b-l big">Refund</div>
          <div className="invoice-info">
            <div className="side1">
              <div className=" b-500">Invoice number</div>
              <div className=" b-500">Receipt number</div>
              <div className=" b-500">Date issued</div>
              <div className=" b-500">Payment method</div>
            </div>
            <div className="side2">
              <div className=" b-500">393F4753-0001</div>
              <div className=" b-500">3770-8198</div>
              <div className=" b-500">October 27, 2024</div>
              <div className=" b-500">Mastercard - 9680</div>
            </div>
          </div>
          <div className="invoice-address">
            <div className="side1">
              <div className=" b-500">coursechamps</div>
              <div className=" b-300">1309 Coffeen Avenue</div>
              <div className=" b-300">STE 1200</div>
              <div className=" b-300">Sheridan, Wyoming 82801</div>
              <div className=" b-300">United States</div>
              <div className=" b-300">+1 929-342-4519</div>
            </div>
            <div className="side2">
              <div className=" b-500">Bill to</div>
              <div className=" b-300">Joy Ghosh</div>
              <div className=" b-300">joyghosh20246@gmail.com</div>
            </div>
          </div>
          <div className="b-l big invoice-address">$999.99 refunded on October 27, 2024</div>
          <div className="m-1 b-300">SMMA Incubator Course</div>
          <div className="row-details m-1">
            <div className="description t-s">Description</div>
            <div className="qty t-s">QTY</div>
            <div className="unit-price t-s">UNIT PRICE</div>
            <div className="amount t-s">AMOUNT</div>
          </div>
          <div className="hr m-1"></div>
          <div className="row-details m-1">
            <div className="description t-s b-500">SMMA Incubator Course</div>
            <div className="qty t-s b-500">1</div>
            <div className="unit-price t-s b-500">$999.99</div>
            <div className="amount t-s b-500">$999.99</div>
          </div>

          <div className="right">
          <div className="hr-light m-3"><div>Subtotal</div><div>$999.99</div></div>
          <div className="hr-light b-none"><div>Total</div><div>$999.99</div></div>
          <div className="hr-light b-none b-500"><div>Amount paid</div><div>$999.99</div></div>
          <div className="hr-light b-none"><div>Refunded on October 27, 2024</div><div>$999.99</div></div>
          <div className="hr-light b-none"><div>Total refunded without credit note</div><div>$999.99</div></div>
          </div>

          <div className="hr-bottom m-x"></div>
          
          <div className="bottom-text t-s m-2 b-300">Refund instructions <br/> Your refund has been issued by coursechamps. It may take about 5 to 10 days to appear on your statement, if it takes longer please contact your bank for
          assistance.</div>

          <div className="t-s m-1 b-300">3770-8198 · $999.99 refunded on October 27, 2024</div>
        </div>
      </div>
      <button onClick={handleDownload}>Download</button>
      
        

        </>
    )
}