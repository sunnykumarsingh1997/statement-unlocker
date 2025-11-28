import {React, useRef, useState} from 'react'
import './basicGmail.css'
import gmailLogo from "../../assets/gmail-logo.png";
import html2pdf from "html2pdf.js";
import Preview from '../../Components/Preview';

export default function BasicGmail(){
  
    
const invoiceRef = useRef();
  const handleDownload = () => {
    const element = invoiceRef.current;
    const options = {
      margin: 0,
      filename: 'invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: [9, 17], orientation: 'portrait' }
    };

    html2pdf()
      .from(element)
      .set(options)
      .save();
  };

  const [contentA, setContentA] = useState();
  const [contentB, setContentB] = useState();
  const [merchant, setMerchant] = useState();
  const [buyer, setBuyer] = useState();
  const [merchantMail, setMerchantMail] = useState();
  const [buyerMail, setBuyerMail] = useState();
  const [subject, setSubject] = useState();
  const [mailSentDate, setMailSentDate] = useState();
  const [mailRecieveDate, setMailRecieveDate] = useState();

  const handleContentA = (e) => {
      setContentA(e.target.value)
  }
  const handleContentB = (e) => {
    setContentB(e.target.value)
}
const handlemerchant = (e) => {
  setMerchant(e.target.value)
}
const handlebuyer = (e) => {
  setBuyer(e.target.value)
}
const handlemerchantMail = (e) => {
  setMerchantMail(e.target.value)
}
const handlebuyerMail = (e) => {
  setBuyerMail(e.target.value)
}
const handlesubject = (e) => {
  setSubject(e.target.value)
}
const handlemailSentDate = (e) => {
  setMailSentDate(e.target.value)
}
const handlemailRecieveDate = (e) => {
  setMailRecieveDate(e.target.value)
}

    return(
        <>
        <div className="basic-gmail-inputs">
        <textarea 
        value={contentA} 
        onChange={handleContentA} 
        rows="4" 
        cols="50"
      />
      <textarea 
        value={contentB} 
        onChange={handleContentB} 
        rows="4" 
        cols="50"
      />
      <div className="flex icici-ends gap-10">
          <div>MERCHANT NAME: </div>
          <input className="input" type="text"  onChange={handlemerchant} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>MERCHANT EMAIL: </div>
          <input className="input" type="text"  onChange={handlemerchantMail} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>BUYER NAME: </div>
          <input className="input" type="text" onChange={handlebuyer}  />
        </div>
        <div className="flex icici-ends gap-10">
          <div>BUYER EMAIL: </div>
          <input className="input" type="text"  onChange={handlebuyerMail} />
        </div>

        <div className="flex icici-ends gap-10">
          <div>MAIL SENT DATE: </div>
          <input className="input" type="text"  onChange={handlemailSentDate} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>MAIL RECIEVE DATE: </div>
          <input className="input" type="text"  onChange={handlemailRecieveDate} />
        </div>
        <div className="flex icici-ends gap-10">
          <div>SUBJECT: </div>
          <input className="input" type="text"  onChange={handlesubject} />
        </div>
      <button onClick={handleDownload}>DOWNLOAD</button>
        </div>

        <Preview title="PREVIEW EMAIL CONVERSATION"/>

            <div className="basicgmail-form amazon-mail-font" ref={invoiceRef}>
            

        <div className="amazon-spacer"></div>

        <div className="amazon-mail-inner-content">
          <div className="flex justify-between align-center">
                      <img src={gmailLogo} alt="gmailLogo" />
                      <div className="amazon-mail-heading-1 bold">
                        {buyer} &lt;{buyerMail}&gt;
                      </div>
                    </div>
          
                    <div className="amazon-spacer"></div>
          <div className="amazon-mail-hr-dark"></div>
          <div className="amazon-mail-hr-light"></div>
          <div className="amazon-margin-2">
            <div className="amazon-mail-heading-1 bold ">
              {subject}
            </div>
            <div className="amazon-mail-small amazon-mail-font">2 messages</div>
          </div>
          <div className="amazon-mail-hr-dark"></div>
          <div className="amazon-mail-hr-light"></div>

          <div class="amazon-gmail-from-to flex ">
            <p>
              <b>{buyer}</b> &lt;{buyerMail}&gt;
            </p>
            <p class="amazon-gmail-date">
               {mailSentDate}
            </p>
          </div>
          <p class="amazon-gmail-to-address">To: {merchantMail}</p>

          <div className="amazon-gmail-content" style={{ whiteSpace: 'pre-wrap' }}>
           {contentA}
          </div>

          <div className="amazon-mail-hr-dark"></div>
          <div className="amazon-mail-hr-light"></div>

          <div class="amazon-gmail-from-to flex ">
            <p>
              <b>{merchant}</b> &lt;{merchantMail}&gt;
            </p>
            <p class="amazon-gmail-date">
               {mailRecieveDate}
            </p>
          </div>
          <p class="amazon-gmail-to-address">To: {buyerMail}</p>

          <div className="amazon-gmail-content" style={{ whiteSpace: 'pre-wrap' }}>
           {contentB}
          </div>

        </div>
            </div>
        </>
    )
}