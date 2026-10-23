import styles from './CustomDetails.module.css';

export function CustomPageNav() {
  return <nav className={styles.pageNav} aria-label="Explore this page">
    <div>
      <a href="#kaka-examples">Kaka’s Photo &amp; Video Comparison</a>
      <a href="#desktop-demo">Desktop Demo</a>
      <a href="#custom-faq">FAQ</a>
    </div>
  </nav>;
}

export function CustomDesktopDemo() {
  return <section id="desktop-demo" className={styles.demoSection} aria-labelledby="desktop-demo-title">
    <div className={styles.container}>
      <h2 id="desktop-demo-title" className={styles.heading}>A familiar face, right beside your work.</h2>
      <p className={styles.lead}>Your custom desktop pet runs in the DeskBub app for Windows or Mac, above your open apps.</p>
      <figure className={styles.recording}>
        <video controls playsInline muted preload="none" poster="/media/custom-desktop-demo/kaka-windows-clear-v2-poster.jpg" aria-label="Kaka running beside an example spreadsheet on a Windows desktop">
          <source src="/media/custom-desktop-demo/kaka-windows-clear-v2.mp4" type="video/mp4" />
          Your browser cannot play this video. <a href="/media/custom-desktop-demo/kaka-windows-clear-v2.mp4">Open the Windows recording</a>.
        </video>
        <figcaption>Actual Windows desktop recording with Kaka and an example spreadsheet. Earlier app version; audio removed. Custom results vary.</figcaption>
      </figure>
      <p className={styles.desktopNote}>Create and preview on the website. Then download DeskBub, enter your pairing code in the app, and bring your pet to your desktop.</p>
    </div>
  </section>;
}

export function CustomPurchaseDetails() {
  return <section id="custom-plans" className={styles.purchaseSection} aria-labelledby="custom-plans-title">
    <div className={styles.container}>
      <h2 id="custom-plans-title" className={styles.heading}>What you get with your custom desktop pet</h2>
      <p className={styles.lead}>Start with your own pet photo. Choose a one-time plan, with no subscription.</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">Basic and Plus custom desktop pet plans. All prices are in US dollars.</caption>
          <thead><tr>
            <td className={styles.tableIntro}>Choose the amount of<br />creative room you need.</td>
            <th scope="col"><span className={styles.planName}>Basic</span><span className={styles.price}>$2.99</span><span className={styles.payment}>one-time · USD</span></th>
            <th scope="col"><span className={styles.planName}>Plus</span><span className={styles.price}>$9.99</span><span className={styles.payment}>one-time · USD</span></th>
          </tr></thead>
          <tbody>
            <tr><th scope="row">Pet photos</th><td>1 photo</td><td>1–5 photos</td></tr>
            <tr><th scope="row">Animation generations</th><td>1</td><td>Up to 8</td></tr>
            <tr><th scope="row">Actions</th><td>1 default action</td><td>Choose from the available actions</td></tr>
            <tr><th scope="row">Final animations</th><td>1 animation</td><td>Select up to 5 favorites</td></tr>
            <tr><th scope="row">Desktop app</th><td>Windows &amp; Mac</td><td>Windows &amp; Mac</td></tr>
          </tbody>
        </table>
      </div>
      <p className={styles.tableNote}>Kaka’s five ready-made animations are the example above. They are separate from a Basic custom pet’s one default action.</p>
      <div className={styles.delivery}>
        <h3>How the desktop pet maker works</h3>
        <ol className={styles.steps}>
          <li><strong>Choose your photo</strong><span>Select a pet photo and pick Basic or Plus.</span></li>
          <li><strong>Confirm your plan</strong><span>Sign in and complete your one-time payment.</span></li>
          <li><strong>Create and preview</strong><span>Remove the background, generate and preview. Plus lets you select up to five favorites.</span></li>
          <li><strong>Pair the app</strong><span>Install DeskBub and enter your pairing code to sync your pet.</span></li>
        </ol>
        <p>Windows 10/11 or macOS 12 and later. The website is for creating and previewing; the desktop app displays your companion.</p>
      </div>
      <div className={styles.actions}><a href="#custom-create" className={styles.primary}>Start with My Pet Photo</a></div>
    </div>
  </section>;
}

const faqs = [
  ['Can I make a desktop pet from my own photo?', 'Yes. Use a clear photo of your dog, cat, or another pet to create a personalized desktop pet. Kaka’s photos and animations above are examples; your custom pet starts with the photo you choose.'],
  ['What is the difference between Basic and Plus?', 'Basic is $2.99 for one photo and one default action. Plus is $9.99 for 1–5 photos and up to eight animation generations, with up to five final favorites selected. Both are one-time purchases with no subscription. Basic does not include all five Kaka example actions.'],
  ['Do I need an app to see my pet on my desktop?', 'Yes. You create and preview your pet on the website, then install DeskBub for Windows or Mac. Enter your pairing code in the desktop app to sync your animations. Playing a video in your browser does not put the pet on your desktop.'],
  ['What kind of pet photo works best?', 'Choose a clear, well-lit photo with one pet standing out from the background. Keep the face, body and paws visible where possible. Avoid motion blur and hands, furniture or other pets covering the subject. You can select JPG, PNG or WebP photos, up to 10 MB each.'],
  ['Will the animation look exactly like my pet?', 'Your photo is the starting point, but generated appearance and movement can vary. Clear photos help, while cropped or hidden body parts can make results less predictable. Kaka’s examples are not a guarantee of an identical result from every photo or action.'],
];

export function CustomFAQ() {
  return <section id="custom-faq" className={styles.faqSection} aria-labelledby="custom-faq-title">
    <div className={styles.faqContainer}>
      <h2 id="custom-faq-title" className={styles.heading}>Questions before you create your pet?</h2>
      <p className={styles.lead}>A few things to know before turning your pet photo into a desktop companion.</p>
      <div className={styles.faqList}>
        {faqs.map(([question, answer], index) => <details key={question} className={styles.faq} open={index === 0}>
          <summary>{question}<svg className={styles.faqIcon} aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5v14" /></svg></summary>
          <p>{answer}</p>
        </details>)}
      </div>
    </div>
  </section>;
}
