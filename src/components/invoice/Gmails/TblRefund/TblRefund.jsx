import {React, useState} from "react";
import "./tblRefund.css"
import html2canvas from "html2canvas"; // Import html2canvas
import TBLlogo from "../../assets/TBL-Logo.png"
import Preview from "../../Components/Preview";

export default function TblRefund(){
    const downloadJPG = () => {
        const invoiceDiv = document.getElementById("invoice");
        html2canvas(invoiceDiv, { scale: 2 }).then((canvas) => {
          const imgData = canvas.toDataURL("image/jpeg", 1.0);
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "invoice.jpg";
          link.click();
        });
      };

    const [name, setName] = useState("XXXX")
    const [email, setEmail] = useState("XXXX")
    const [course, serCourse] = useState("XXXX")
    const [address1, setAddress1] = useState("XXXX")
    const [address2, setAddress2] = useState("")
    const [address3, setAddress3] = useState("")
    const [orderNo, serOrderNo] = useState("XXXX")
    const [purchased, setPurchased] = useState("XXXX")
    const [issued, setIssued] = useState("XXXX")
    const [card, setCard] = useState("XXXX")
    const [cardLast, setCardLast] = useState("XXXX")
    const [amount, setAmount] = useState("XXXX")
    const [courseID, setCourseID] = useState("XXXX")
    const [refID, setRefID] = useState("XXXX")

    const handleName = (e) => {
        setName(e.target.value)
    }
    const handleEmail = (e) => {
        setEmail(e.target.value)
    }
    const handleCourse = (e) => {
        serCourse(e.target.value)
    }
    const handleAddress1 = (e) => {
        setAddress1(e.target.value)
    }
    const handleAddress2 = (e) => {
        setAddress2(e.target.value)
    }
    const handleAddress3 = (e) => {
        setAddress3(e.target.value)
    }
    const handleOrderNo = (e) => {
        serOrderNo(e.target.value)
    }
    const handlePurchased = (e) => {
        setPurchased(e.target.value)
    }
    const handleIssued = (e) => {
        setIssued(e.target.value)
    }
    const handleCard = (e) => {
        setCard(e.target.value)
    }
    const handleCardLast = (e) => {
        setCardLast(e.target.value)
    }
    const handleAmount = (e) => {
        setAmount(e.target.value)
    }
    const handleCourseID = (e) => {
        setCourseID(e.target.value)
    }
    const handleRefNo = (e) => {
        setRefID(e.target.value)
    }
    
    return(
        <>
            <div className="input-fields">
        <div className="flex icici-ends gap-10">
          <div>CONTACT NAME: </div>
          <input className="input" type="text" onChange={handleName}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>CONTACT EMAIL: </div>
          <input className="input" type="text" onChange={handleEmail}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>COURSE NAME: </div>
          <input className="input" type="text" onChange={handleCourse}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>COURSE ID: </div>
          <input className="input" type="text" onChange={handleCourseID}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>ADDRESS LINE 1: </div>
          <input className="input" type="text" onChange={handleAddress1}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>ADDRESS LINE 2: </div>
          <input className="input" type="text" onChange={handleAddress2}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>ADDRESS LINE 3: </div>
          <input className="input" type="text" onChange={handleAddress3}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>ORDER NO: </div>
          <input className="input" type="text" onChange={handleOrderNo}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>PURCHASED DATE: </div>
          <input className="input" type="text" onChange={handlePurchased}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>ISSUED DATE: </div>
          <input className="input" type="text" onChange={handleIssued}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>CARD TYPE: </div>
          <input className="input" type="text" onChange={handleCard}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>CARD LST 4: </div>
          <input className="input" type="text" onChange={handleCardLast}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>AMOUNT: </div>
          <input className="input" type="text" onChange={handleAmount}/>
        </div>
        <div className="flex icici-ends gap-10">
          <div>ref no: </div>
          <input className="input" type="text" onChange={handleRefNo}/>
        </div>

        <div className="icici-hr-light"></div>
        <button onClick={downloadJPG}>DOWNLOAD</button>
      </div>

        <Preview title="PREVIEW TEACHABLE REFUND INVOICE"/>

      <div className="tbl-invoice-body" id="invoice">
        <div class="tbl-invoice-container">
        <div className="tbl-invoice-logo"><img src={TBLlogo} alt="" /></div>
        <h1 class="tbl-invoice-header">{course}</h1>

        <div className="tbl-invoice-hr"></div>

        <div class="tbl-invoice-section tbl-invoice-info">
            <div>
                <h2 class="tbl-invoice-section-header">Contact Information</h2>
                <p>{name}</p>
                <p className="tbl-invoice-tblColor">{email}</p>
            </div>
            <div>
                <h2 class="tbl-invoice-section-header">Billing Info</h2>
                <p>{address1}</p>
                <p>{address2}</p>
                <p>{address3}</p>
                <h2 class="tbl-invoice-section-header">Delivery Address</h2>
                <p>{address1}</p>
                <p>{address2}</p>
                <p>{address3}</p>
            </div>
        </div>

        <div className="tbl-invoice-hr"></div>

        <div className="tbl-invoice-section tbl-invoice-info">
            <div>
                
                <p className="tbl-invoice-bold">Order Number: {orderNo}</p>
                <p>Purchased Date: {purchased}</p>
                <p>Issued Date: {issued}</p>
                <p>Reference number: {refID}</p>
            </div>
            <div>
                <h2 class="tbl-invoice-section-header">Payment Method</h2>
                <p>{card} - *{cardLast}</p>
                <p>{name}</p>
            </div>
        </div>

        <div className="tbl-invoice-hr"></div>

        <div class="tbl-invoice-section flex">
            <div className="tbl-invoice-totals-left">
                <div className="flex tbl-invoice-section-amounts">
                    <div className="tbl-invoice-bold tbl-invoice-header-course">{course} (ID: {courseID})</div> 
                    <div>{amount}</div>
                </div>
                <div className="flex tbl-invoice-section-amounts"><div>Subtotal</div><div>{amount}</div></div>
                <div className="flex tbl-invoice-section-amounts"><div>Total</div><div>{amount}</div></div>
                <div className="flex tbl-invoice-section-amounts"><div>Amount Refunded</div><div>{amount}</div></div>
                <div className="flex tbl-invoice-section-amounts"><div>Adjusted Tax (0.0%)</div><div>£0</div></div>
                <div className="flex tbl-invoice-section-amounts tbl-invoice-bold"><div>Adjusted Total (GBP)</div><div className="tbl-invoice-bold">£0</div></div>
            </div>
        </div>

        <div className="tbl-invoice-hr"></div>

        <div class="tbl-invoice-footer tbl-invoice-section flex">
            <div>
            <div className="tbl-invoice-bold">Provider</div> <p className="tbl-invoice-tblColor">Procandi Limited - Coaching for Entrepreneurs</p>
            <p className="tbl-invoice-link-color">Procandi.co.uk</p>
            </div>

            <div className="tbl-invoice-margin-left-10">
            <div className="tbl-invoice-bold">Supplier</div> <p className="tbl-invoice-tblColor">Teachable</p>
            <p><span className="tbl-invoice-link-color">470 Park Ave South</span>, Sixth Floor <br/> New York, NY 10016 US</p>
            <p>Tax ID: 100500265200003</p>
            </div>
        </div>

        <div className="tbl-invoice-hr"></div>

        <div className="tbl-invoice-copyright">Not a Tax Invoice</div>
        <div className="tbl-invoice-copyright">Questions about this payment? Contact Procandi Limited - Coaching for Entreprenuers</div>
        <div className="tbl-invoice-copyright">© Procandi.co.uk</div>
    </div>

      </div>
        </>
    )
}