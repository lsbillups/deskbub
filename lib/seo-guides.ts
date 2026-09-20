export type GuideTable = {
  headers: string[];
  rows: string[][];
};

export type GuideSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  steps?: { title: string; body: string }[];
  table?: GuideTable;
  note?: string;
};

export type SeoGuide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  updatedAt: string;
  eyebrow: string;
  intro: string;
  quickAnswer: string;
  keywords: string[];
  visual: 'photo' | 'free' | 'mac' | 'windows' | 'safety' | 'compare' | 'kaka' | 'cat';
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  related: string[];
};

const publishedAt = '2026-09-09';
const firstWavePublishedAt = '2026-09-10';
const secondWavePublishedAt = '2026-09-11';

const allSeoGuides: SeoGuide[] = [
  {
    slug: 'how-to-turn-a-pet-photo-into-a-desktop-pet',
    title: 'How to Turn a Pet Photo Into a Desktop Pet',
    description:
      'Learn how a clear photo of your dog, cat, rabbit, bird, or other pet becomes a recognizable animated desktop companion for Windows or Mac.',
    category: 'Photo to Desktop Pet',
    readingTime: '8 min read',
    publishedAt: firstWavePublishedAt,
    updatedAt: '2026-09-19',
    eyebrow: 'Your pet, not a character pack',
    intro:
      'Turn a photo of your dog, cat, or another pet into a custom desktop companion. The goal is to preserve enough of your pet’s face, coloring, shape, and personality that the animal on screen feels familiar.',
    quickAnswer:
      'Choose one clear pet photo, use it as the visual reference for the animated actions, review the result, then pair the finished pet with a transparent desktop app. DeskBub handles that workflow for Windows and Mac, while Kaka lets you try the desktop experience free first.',
    keywords: [
      'desktop pet from photo',
      'custom desktop pet from photo',
      'turn pet photo into desktop pet',
      'personalized desktop pet',
      'AI desktop pet generator from photo',
    ],
    visual: 'photo',
    sections: [
      {
        id: 'what-you-are-making',
        title: 'First, decide what “desktop pet” means to you',
        paragraphs: [
          'Some desktop pets are ready-made pixel characters. Others are engines that expect you to supply drawings and animation frames. A pet-photo service solves a different problem: you have a real animal and want a recognizable version of that animal to stay above your everyday apps.',
          'That distinction changes the workflow. Instead of browsing character packs, you begin with identity: the markings around the eyes, ear shape, tail, body proportions, and colors that make your pet easy to recognize.',
        ],
        table: {
          headers: ['Starting point', 'Best fit', 'Typical result'],
          rows: [
            ['Ready-made character', 'You want something cute immediately', 'A generic mascot or fictional character'],
            ['Sprite or pet engine', 'You already draw or animate', 'A pet built from assets you prepare'],
            ['Real pet photo', 'You want your own animal on screen', 'A personalized animated desktop companion'],
          ],
        },
      },
      {
        id: 'choose-photo',
        title: 'Choose one photo that makes your pet easy to recognize',
        paragraphs: [
          'A useful source photo is clear, well lit, and centered on one animal. The face should be visible, and the body outline should not disappear behind furniture, blankets, hands, or another pet.',
          'A simple phone photo can work. Professional photography is not required. What matters more is whether the image clearly shows the features you would use to identify your pet at a glance.',
        ],
        bullets: [
          'Use even lighting so dark and light markings remain visible.',
          'Keep the face, ears, legs, and tail in frame when possible.',
          'Avoid heavy filters, stickers, text, and motion blur.',
          'Choose one pet per image instead of asking the system to guess.',
        ],
      },
      {
        id: 'photo-to-motion',
        title: 'Turn the visual reference into movement',
        paragraphs: [
          'The source photo establishes appearance; the animation adds behavior. A finished desktop pet needs transparent frames or video, clean edges, consistent scale, and motion that does not make the pet change identity between frames.',
          'Review the face, coat pattern, silhouette, and motion together. A technically smooth animation is not enough if the pet no longer looks familiar. If the likeness is weak, a clearer source photo is usually more useful than repeatedly accepting a poor reference.',
        ],
        steps: [
          { title: 'Upload', body: 'Start with one clear photo and identify the animal type.' },
          { title: 'Generate', body: 'Create a transparent animated action using the photo as the identity reference.' },
          { title: 'Review', body: 'Check likeness, outline, motion, and whether important markings survived.' },
          { title: 'Pair', body: 'Open the desktop app and pair the approved pet with Windows or Mac.' },
        ],
      },
      {
        id: 'realistic-expectations',
        title: 'Know what the result can—and cannot—preserve',
        paragraphs: [
          'A custom desktop pet is an animated interpretation, not a live camera feed or an exact reconstruction of every strand of fur. A strong result preserves the features that matter most while remaining readable at desktop size.',
          'Different poses may require the system to infer parts of the body that are hidden in the photo. Unusual markings, clothing, long fur, cropped paws, and complex backgrounds can make that inference harder. Honest expectations produce better photo choices and better decisions.',
        ],
        note:
          'DeskBub should be judged by the preview and the recognizable details it preserves—not by a promise of perfect photographic reconstruction.',
      },
      {
        id: 'try-before-custom',
        title: 'Try the desktop experience free before making your own',
        paragraphs: [
          'Kaka is the real dog behind DeskBub. He is included at no cost so you can see how a pet floats above apps, moves around the screen, and fits into a normal workday before paying for custom generation.',
          'If the experience feels right, the custom path starts with your own photo. Free Kaka and paid customization are separate: trying Kaka does not make custom pet generation free.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I make a desktop pet from one photo?',
        answer:
          'Yes. DeskBub starts from one clear pet photo. A visible face, clean body outline, and good lighting give the system a better identity reference.',
      },
      {
        question: 'Can I use a dog, cat, rabbit, or bird photo?',
        answer:
          'Yes. DeskBub is designed for dogs, cats, rabbits, birds, and other clearly visible pets rather than a fixed library of generic characters.',
      },
      {
        question: 'Is a custom desktop pet free?',
        answer:
          'Kaka is included free with no account or payment. Creating a pet from your own photo is a separate one-time purchase starting at $1.',
      },
    ],
    related: ['best-free-desktop-pets', 'how-to-get-a-desktop-pet-on-mac', 'how-to-get-a-desktop-pet-on-windows-11'],
  },
  {
    slug: 'best-free-desktop-pets',
    title: 'Best Free Desktop Pets for Windows and Mac',
    description:
      'Compare free desktop pet options for Windows and Mac, including ready-made pets, open-source libraries, AI companions, and a real-dog pet you can try free.',
    category: 'Free Desktop Pets',
    readingTime: '9 min read',
    publishedAt: firstWavePublishedAt,
    updatedAt: firstWavePublishedAt,
    eyebrow: 'Free options, compared honestly',
    intro:
      'The best free desktop pet depends on what you want: a collection of characters, an open-source platform, productivity tools, or a pet based on an animal you actually know. This guide separates those jobs instead of pretending one app wins every category.',
    quickAnswer:
      'Choose Microsoft Store Desktop Pets for a free Windows collection, OpenPets for an open-source multi-platform library, or DeskBub when you want to try a real-dog desktop pet free and keep the option to create your own pet from a photo.',
    keywords: [
      'free desktop pet',
      'desktop pet free download',
      'best desktop pet apps',
      'free desktop pet for Windows',
      'free desktop pet for Mac',
    ],
    visual: 'free',
    sections: [
      {
        id: 'comparison',
        title: 'Free desktop pet options at a glance',
        paragraphs: [
          'The comparison below uses information visible on official product pages on September 9, 2026. Availability, pricing, and platform support can change, so verify the download page before installing.',
        ],
        table: {
          headers: ['Option', 'Platforms', 'Best for', 'Important distinction'],
          rows: [
            ['Desktop Pets by brksfrb', 'Windows', 'Feeding and collecting ready-made animated pets', 'Free with in-app purchases; generic collection'],
            ['OpenPets', 'Windows, Mac, Linux', 'Open-source pets, plugins, and a large gallery', 'Community and character library rather than your photo'],
            ['DeskBub with Kaka', 'Windows, Mac', 'Trying a desktop pet based on a real dog', 'Kaka is free; your own custom pet is paid'],
          ],
        },
      },
      {
        id: 'choose-by-goal',
        title: 'Choose by goal, not by the longest feature list',
        paragraphs: [
          'A large gallery is useful when variety matters. An open-source project is useful when you want to inspect or extend the software. Productivity features matter when you want chat, timers, or task support. None of those automatically answers the emotional question a pet owner may have: can this look like my animal?',
          'Start by deciding whether you want any desktop character or your own pet. That single choice removes most of the confusion in search results.',
        ],
        bullets: [
          'Want many ready-made characters: prioritize a library or store collection.',
          'Want open source and plugins: prioritize transparent code and documentation.',
          'Want an AI helper: compare conversation, privacy, and productivity features.',
          'Want your actual pet: look for a photo-based workflow and visible before-and-after evidence.',
        ],
      },
      {
        id: 'what-free-means',
        title: 'Check what “free” includes',
        paragraphs: [
          'Free can mean a complete app, an open-source project, a demo, a sample pet, or a free download with paid items inside. Those are all valid models, but they are not interchangeable.',
          'DeskBub includes Kaka at no cost and does not require an account or payment to use him. Custom generation from your own photo is separate and starts at $1 as a one-time purchase.',
        ],
        note:
          'Be suspicious of a download page that hides the publisher, operating-system requirements, price boundaries, or uninstall instructions.',
      },
      {
        id: 'safe-download',
        title: 'Download from the publisher or an official store',
        paragraphs: [
          'Desktop pets are real applications, not just images. Prefer the official publisher page, Microsoft Store, Steam, or the project’s verified GitHub releases. Avoid repackaged installers and unknown character-download sites.',
          'Before opening an installer, confirm that the product name, publisher, file source, operating system, and expected price all match the page you chose.',
        ],
      },
      {
        id: 'deskBub-choice',
        title: 'Where DeskBub fits',
        paragraphs: [
          'DeskBub is not trying to offer the largest generic character collection. Kaka gives anyone a free way to try the desktop app. The custom route is for pet owners who want a recognizable companion made from a real pet photo.',
          'That makes DeskBub a useful bridge: start free, learn whether a floating pet suits your desktop, then create your own only if the experience is worth it to you.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the best free desktop pet?',
        answer:
          'There is no universal winner. The best choice depends on whether you want a character collection, open-source customization, AI productivity features, or a pet connected to a real animal.',
      },
      {
        question: 'Is DeskBub free?',
        answer:
          'Kaka is included free with no account or payment. Creating a custom desktop pet from your own photo is a paid one-time option.',
      },
      {
        question: 'Where should I download a desktop pet?',
        answer:
          'Use the official publisher website, an official app store, Steam, or a verified GitHub release. Avoid repackaged installers from unknown download sites.',
      },
    ],
    related: ['are-desktop-pets-safe', 'how-to-get-a-desktop-pet-on-windows-11', 'how-to-get-a-desktop-pet-on-mac'],
  },
  {
    slug: 'how-to-get-a-desktop-pet-on-mac',
    title: 'How to Get a Desktop Pet on Mac or MacBook',
    description:
      'A practical guide to downloading, installing, showing, hiding, and removing a desktop pet on macOS, with free and custom-pet options.',
    category: 'Mac Guide',
    readingTime: '7 min read',
    publishedAt: secondWavePublishedAt,
    updatedAt: secondWavePublishedAt,
    eyebrow: 'A practical macOS guide',
    intro:
      'A Mac desktop pet is a small transparent app window that stays visible while you work. The important decisions are where you download it, whether your Mac supports it, and whether you want a ready-made character or your own pet from a photo.',
    quickAnswer:
      'Download the macOS build from the official publisher, move or open the app as instructed, verify any security prompt, then use the app controls to show, hide, move, or resize the pet. DeskBub supports macOS 12 or later and includes Kaka free.',
    keywords: [
      'desktop pet Mac',
      'desktop pet for Mac',
      'desktop pet MacBook',
      'desktop pet macOS',
      'free desktop pet for Mac',
    ],
    visual: 'mac',
    sections: [
      {
        id: 'choose',
        title: 'Choose the type of Mac desktop pet you want',
        paragraphs: [
          'Ready-made pets are quickest when you simply want a mascot. Shimeji-style tools make sense when you want downloadable character packs. A photo-based service is the better fit when the animal on screen should look like your own dog, cat, rabbit, bird, or other pet.',
          'DeskBub offers both an easy starting point and a personal path: Kaka is free, while creating a pet from your own photo is a separate one-time purchase.',
        ],
      },
      {
        id: 'install',
        title: 'Install a desktop pet on macOS',
        paragraphs: [
          'Confirm your macOS version first. DeskBub currently lists macOS 12 or later. Download the DMG from the official DeskBub download page, open it, and follow the installer window.',
          'If macOS displays a security message, do not bypass it automatically. Confirm that you used the official link and that the app name matches what you expected. If the source is correct, use the normal macOS Privacy & Security controls to review the blocked app.',
        ],
        steps: [
          { title: 'Verify support', body: 'Check your macOS version and the publisher’s current system requirements.' },
          { title: 'Use the official download', body: 'Avoid copied installers and third-party repackaging sites.' },
          { title: 'Review the prompt', body: 'Read the app name and source before approving any macOS security action.' },
          { title: 'Open the pet', body: 'Launch the app and use its menu to move, resize, hide, or exit.' },
        ],
      },
      {
        id: 'daily-use',
        title: 'Make the pet fit your normal Mac workflow',
        paragraphs: [
          'A desktop pet should be easy to hide when you present, share your screen, or need an uncluttered workspace. Check that the app has a clear Show/Hide control and a reliable Quit command.',
          'Also test size, opacity, movement, and whether the pet remains visible above the apps where you want it. A companion that cannot get out of the way will stop feeling friendly very quickly.',
        ],
        bullets: [
          'Try the pet on the display you use most.',
          'Check how it behaves with full-screen apps and multiple desktops.',
          'Use a lower-activity setting when you need to focus.',
          'Know how to quit and reopen the app before enabling startup behavior.',
        ],
      },
      {
        id: 'free-or-custom',
        title: 'Start with Kaka free—or make your own pet',
        paragraphs: [
          'Kaka lets you test the complete idea without an account or payment. He is based on the real dog behind DeskBub, so the free experience also demonstrates how a recognizable animal can become a desktop companion.',
          'If you want your own pet, upload one clear photo and choose a custom option. The custom result pairs with the same desktop app; it is not included in the free Kaka download.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does DeskBub work on MacBook?',
        answer: 'DeskBub supports Macs running macOS 12 or later. Check the current download page before installing.',
      },
      {
        question: 'Can I get a free desktop pet for Mac?',
        answer: 'Yes. Kaka is included with DeskBub at no cost and does not require an account or payment.',
      },
      {
        question: 'Can I use my own cat or dog on Mac?',
        answer: 'Yes. Custom desktop pets made from your photo can be paired with the DeskBub Mac app.',
      },
    ],
    related: ['best-free-desktop-pets', 'are-desktop-pets-safe', 'how-to-turn-a-pet-photo-into-a-desktop-pet'],
  },
  {
    slug: 'how-to-get-a-desktop-pet-on-windows-11',
    title: 'How to Get a Desktop Pet on Windows 11',
    description:
      'Download and install a desktop pet on Windows 11 or Windows 10, understand SmartScreen prompts, and choose between free and custom pets.',
    category: 'Windows Guide',
    readingTime: '7 min read',
    publishedAt: firstWavePublishedAt,
    updatedAt: firstWavePublishedAt,
    eyebrow: 'Windows 11 and Windows 10',
    intro:
      'A Windows desktop pet runs in a transparent window above ordinary applications. You can install a generic pet collection, use an open-source project, or choose a pet made from your own photo.',
    quickAnswer:
      'Download the Windows installer from the official publisher, verify the file and any SmartScreen message, install the app, then use its tray or in-app controls to show, hide, move, and quit the pet. DeskBub supports Windows 10 and 11 and includes Kaka free.',
    keywords: [
      'desktop pet Windows 11',
      'desktop pet for Windows',
      'free desktop pet for Windows',
      'desktop pet Windows 10',
      'how to get desktop pets',
    ],
    visual: 'windows',
    sections: [
      {
        id: 'choose',
        title: 'Pick the right Windows desktop pet',
        paragraphs: [
          'Microsoft Store results often focus on free collections of animated animals. Open-source projects focus on libraries and extensibility. Some AI pets focus on conversation or productivity. DeskBub focuses on a free real-dog sample and custom pets based on real photos.',
          'Choose based on the result you want, not only the number of characters. A person who wants any cute duck and a person who wants their own dog are making different decisions.',
        ],
      },
      {
        id: 'install',
        title: 'Download and install on Windows 11',
        paragraphs: [
          'Use the official publisher, Microsoft Store, Steam, or a verified GitHub release. DeskBub links its current Windows installer from its official download page and lists Windows 10 or 11 as the requirement.',
          'Windows SmartScreen may show a warning for unfamiliar downloads. A warning is not by itself proof that a file is malicious, but it is a reason to stop and verify the filename, publisher, page, and download source before continuing.',
        ],
        steps: [
          { title: 'Open the official page', body: 'Begin with the publisher rather than a search-result download mirror.' },
          { title: 'Check the requirement', body: 'Confirm Windows 10 or 11 and enough permission to install an app.' },
          { title: 'Verify the installer', body: 'Read the filename and source before responding to SmartScreen.' },
          { title: 'Learn the controls', body: 'Find Show/Hide, size, movement, and Quit before enabling startup.' },
        ],
      },
      {
        id: 'performance',
        title: 'Check performance and screen behavior',
        paragraphs: [
          'A desktop pet should remain lightweight enough for the computer where you plan to use it. Watch CPU and memory use during normal work, especially on older laptops or when several displays are connected.',
          'Test whether the pet blocks clicks, disappears behind windows, or becomes distracting. The useful controls are often simple: movement, size, opacity, reminders, Show/Hide, and a clear exit command.',
        ],
      },
      {
        id: 'free-custom',
        title: 'Understand the free and custom paths',
        paragraphs: [
          'DeskBub includes Kaka free. You can install the Windows app and use him without creating an account or entering payment details.',
          'Creating a desktop pet from your own photo is optional and paid. Custom pets start at $1 as a one-time purchase and use a pairing code to replace Kaka in the desktop app.',
        ],
        note: 'Free Kaka is a complete starting experience. “Free” does not mean that custom photo generation is free.',
      },
    ],
    faqs: [
      {
        question: 'Can I get a desktop pet on Windows 11?',
        answer: 'Yes. DeskBub supports Windows 10 and Windows 11, and other desktop pet options are also available through official stores and publishers.',
      },
      {
        question: 'Is a SmartScreen warning proof that a desktop pet is unsafe?',
        answer:
          'No. SmartScreen can warn about unfamiliar files, but you should still stop and verify the publisher, source, filename, and expected product before continuing.',
      },
      {
        question: 'Is the DeskBub Windows desktop pet free?',
        answer: 'Kaka is free with no account or payment. A custom pet made from your own photo is a separate paid option.',
      },
    ],
    related: ['best-free-desktop-pets', 'are-desktop-pets-safe', 'how-to-turn-a-pet-photo-into-a-desktop-pet'],
  },
  {
    slug: 'are-desktop-pets-safe',
    title: 'Are Desktop Pets Safe? What to Check Before You Download',
    description:
      'Use a practical desktop pet safety checklist: verify the download source, understand Windows and Mac warnings, check data use, and know how to uninstall.',
    category: 'Safety Guide',
    readingTime: '8 min read',
    publishedAt: secondWavePublishedAt,
    updatedAt: '2026-09-20',
    eyebrow: 'Check the app before you trust it',
    intro:
      'A desktop pet is real software, not just a GIF. It may stay above other windows, start with your computer, connect to the internet, or upload a photo when you create a custom pet. None of that automatically makes it unsafe—but a cute character is not evidence that an installer is trustworthy.',
    quickAnswer:
      'A desktop pet can be safe when it comes from an official source, its filename and publisher match the product you chose, its behavior and data use are explained, and you can quit and uninstall it normally. Stop if the download comes from an unknown mirror, asks for an unexpected capability, or does not explain what happens to your data.',
    keywords: [
      'is desktop pet safe',
      'are desktop pets safe',
      'safe desktop pet download',
      'desktop pet virus',
      'desktop pet permissions',
    ],
    visual: 'safety',
    sections: [
      {
        id: 'quick-check',
        title: 'Use this 60-second desktop pet safety check',
        paragraphs: [
          'You do not need to reverse-engineer an app before installing it. Start with five checks that catch the most obvious problems. If one answer is unclear, pause and verify it instead of treating the download button as proof of safety.',
        ],
        bullets: [
          'Source: did the file come from the publisher, an official store, or the project’s verified release page?',
          'Identity: do the product name, filename, publisher, operating system, and advertised price match?',
          'Access: does the app ask only for capabilities that make sense for the features you selected?',
          'Data: does the product explain what leaves your computer and which companies process it?',
          'Control: can you hide, quit, disable startup, and uninstall the app using normal controls?',
        ],
      },
      {
        id: 'source',
        title: 'Download from a source you can verify',
        paragraphs: [
          'Prefer the publisher’s website, an established app store, or a release page linked by the project itself. A search-result mirror, forum attachment, or re-uploaded archive can be outdated or different from the file the developer intended to distribute.',
          'Search position, polished graphics, and the word “free” are not security evidence. Before opening a file, keep the official product page available and compare what you downloaded with what that page promised.',
        ],
        table: {
          headers: ['Check', 'A reassuring sign', 'A reason to stop'],
          rows: [
            ['Download location', 'Publisher site, official store, or verified project release', 'Unknown mirror, comment link, or unrelated file host'],
            ['File identity', 'Expected app name, platform, and file type', 'Misspelled name, wrong platform, or unexpected archive'],
            ['Offer', 'Price and included features match the product page', 'A surprise payment, bundle, extension, or extra installer'],
            ['Product history', 'Visible documentation, release notes, or support contact', 'No identifiable publisher or way to ask about the file'],
          ],
        },
      },
      {
        id: 'system-warnings',
        title: 'Treat Windows and Mac warnings as a checkpoint',
        paragraphs: [
          'Windows SmartScreen and macOS Gatekeeper can warn about downloaded or unfamiliar software. A warning is not proof that an app contains a virus, but it is also not a message to dismiss automatically.',
          'Stop and read the exact alert. Confirm that you intentionally downloaded the app from its official source and that the product name and file match. If the warning names a different app, the source is unclear, or you did not expect an installer to open, cancel and delete the file.',
        ],
        steps: [
          { title: 'Read the alert', body: 'Note the exact app name, publisher information, and reason the operating system is warning you.' },
          { title: 'Return to the source', body: 'Verify the download page, expected filename, supported operating system, and installation instructions.' },
          { title: 'Decide independently', body: 'Continue only when the warning matches a file you intentionally obtained from a source you trust.' },
          { title: 'Stop when details differ', body: 'A mismatched name, unexpected request, or unknown source is enough reason to cancel and investigate.' },
        ],
      },
      {
        id: 'access-and-data',
        title: 'Check what the pet can access—and what leaves your computer',
        paragraphs: [
          'A simple pet may only need a transparent window, clicks, and a place to save settings. Products that add microphones, screen awareness, AI chat, plugins, accounts, cloud sync, or photo generation raise additional privacy questions.',
          'Do not assume that the absence of a permission pop-up means a Windows desktop app cannot access data. Read the product documentation and privacy policy, then compare those claims with the features you actually use.',
        ],
        table: {
          headers: ['Capability', 'What to verify'],
          rows: [
            ['Transparent pet window', 'Whether it only displays and receives clicks or also analyzes other windows'],
            ['Start with your computer', 'Whether startup is optional and where you can turn it off'],
            ['Microphone or screen awareness', 'Why it is needed, when it is active, and whether you can disable it'],
            ['Pet-photo upload', 'Where the photo is processed and stored, who processes it, and how deletion works'],
            ['Account or payment', 'Which provider handles identity or payment data and what the pet app receives'],
          ],
        },
      },
      {
        id: 'deskbub-boundary',
        title: 'What DeskBub does with free and custom use',
        paragraphs: [
          'Kaka can be downloaded and used without creating an account or making a payment. DeskBub’s official download page links to its public GitHub releases for Windows and macOS.',
          'The custom-pet workflow is different. DeskBub uses Clerk for authentication, Supabase for pet photos and generated content, Replicate for AI processing, and Creem for payments. DeskBub does not receive your full card number. Its privacy policy says personal data is not sold and that you can request deletion of your account and associated content by contacting support.',
          'These disclosures describe the current service; they are not a promise that every part of custom generation happens only on your computer. Read the privacy policy before uploading a photo, and upload only an image you own or have permission to use.',
        ],
        note:
          'Use the official DeskBub download page for installers. Use support@deskbub.com for privacy questions or a verified deletion request.',
      },
      {
        id: 'control-and-removal',
        title: 'Make sure you can stop and remove the pet',
        paragraphs: [
          'Safety also means remaining in control after installation. You should be able to hide the pet, quit its process, turn off unwanted startup behavior, and remove the application through the normal Windows or macOS workflow.',
          'During ordinary use, watch for unexplained CPU, memory, battery, or network activity. A visual companion will use some resources, but it should not make your computer unexpectedly difficult to use. If a pet cannot be closed or removed as documented, stop using it and ask the publisher for support.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can a desktop pet contain malware?',
        answer:
          'Any downloaded executable can be malicious or repackaged, so the category itself is not a guarantee. Use the publisher’s official source or a verified store or release page, and stop when the file identity or behavior does not match what was advertised.',
      },
      {
        question: 'Can a desktop pet see my screen?',
        answer:
          'It depends on the product. Displaying a transparent always-on-top window does not by itself mean an app analyzes your screen, but some AI pets advertise screen-aware features. Check the exact product documentation and data policy instead of assuming every desktop pet behaves the same way.',
      },
      {
        question: 'Is a SmartScreen or Gatekeeper warning proof of a virus?',
        answer:
          'No. An operating-system warning can appear for downloaded or unfamiliar software, but you should not bypass it blindly. Verify the source, product name, filename, publisher information, and installation instructions before deciding whether to continue.',
      },
      {
        question: 'Do I need to upload a photo to use DeskBub?',
        answer:
          'Not to use Kaka. Kaka works without an account, payment, or pet-photo upload. Uploading a photo is part of the separate custom-pet workflow and uses the processors described in DeskBub’s privacy policy.',
      },
      {
        question: 'How do I remove a desktop pet?',
        answer:
          'Quit the app first, disable any startup option, then use the normal uninstall process for Windows or macOS. If the publisher provides a dedicated uninstaller or removal instructions, follow those instructions rather than deleting random application files.',
      },
    ],
    related: ['best-free-desktop-pets', 'how-to-get-a-desktop-pet-on-windows-11', 'how-to-get-a-desktop-pet-on-mac'],
  },
  {
    slug: 'shimeji-vs-desktop-pet',
    title: 'Shimeji vs Desktop Pet: Which One Should You Choose?',
    description:
      'Compare Shimeji character mascots with desktop pet apps, open-source pet libraries, and custom desktop pets made from a real pet photo.',
    category: 'Comparison',
    readingTime: '8 min read',
    publishedAt: secondWavePublishedAt,
    updatedAt: secondWavePublishedAt,
    eyebrow: 'Character pack or your own pet?',
    intro:
      'People often use “Shimeji” and “desktop pet” for similar screen companions, but the terms hide several different products. The useful choice is not which label sounds better; it is whether you want a downloadable character, a tool for your own artwork, or a companion based on your real pet.',
    quickAnswer:
      'Choose Shimeji when you want existing character mascots and community-made skins. Choose a desktop pet engine when you want to build behavior from your own art assets. Choose a photo-based service such as DeskBub when you want your actual dog, cat, rabbit, bird, or other pet to be recognizable on screen.',
    keywords: [
      'shimeji desktop pet',
      'shimeji alternative',
      'desktop pet vs shimeji',
      'custom shimeji',
      'make your own shimeji',
    ],
    visual: 'compare',
    sections: [
      {
        id: 'difference',
        title: 'The starting material is the biggest difference',
        paragraphs: [
          'Shimeji-style companions are closely associated with small animated characters that climb, walk, or multiply around the screen. Their strength is access to familiar characters and a culture of downloadable skins.',
          'A custom photo-based desktop pet starts somewhere else: with one real animal. The work is less about finding a character pack and more about preserving markings, shape, and personality from a photo.',
        ],
        table: {
          headers: ['Option', 'You start with', 'Best for'],
          rows: [
            ['Shimeji', 'An existing character or skin', 'Anime, game, and community characters'],
            ['Desktop pet engine', 'Your own prepared art or animation assets', 'Creators who want behavior control'],
            ['Photo-based desktop pet', 'A real pet photo', 'Pet owners who want a recognizable animal'],
          ],
        },
      },
      {
        id: 'customization',
        title: '“Custom” can mean three different things',
        paragraphs: [
          'Changing a Shimeji skin is customization, but the visual asset still has to exist. Building an engine project is also customization, but it may require drawing, frame preparation, configuration, or code.',
          'DeskBub uses “custom” to mean that the companion is generated from your own pet photo. You do not need to arrive with a sprite sheet or animation file.',
        ],
      },
      {
        id: 'free',
        title: 'Compare the free path honestly',
        paragraphs: [
          'Shimeji ecosystems often have free characters, while open-source desktop pet projects may make the software and pet packs free. The tradeoff can be inconsistent sources and varying setup quality.',
          'DeskBub’s free path is specific: Kaka, the real dog behind DeskBub, is included with the Windows and Mac app. Making your own pet from a photo is optional and paid.',
        ],
      },
      {
        id: 'choose',
        title: 'Which should you choose?',
        paragraphs: [
          'Choose Shimeji if the exact fictional character or skin is the reason you are searching. Choose an engine if building and sharing assets is part of the fun. Choose DeskBub if the emotional connection to your own pet is the point.',
          'These options are not direct substitutes for every user. A good comparison should help the wrong audience leave confidently instead of forcing every searcher toward the same product.',
        ],
        bullets: [
          'Character fan: start with Shimeji.',
          'Artist or developer: consider an engine or open-source platform.',
          'Pet owner: use a photo-based custom workflow.',
          'Unsure about desktop pets: try Kaka free before paying for customization.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Shimeji the same as a desktop pet?',
        answer:
          'Shimeji is one well-known style of screen mascot. “Desktop pet” is broader and includes character collections, virtual-pet apps, AI companions, engines, and photo-based custom pets.',
      },
      {
        question: 'Can Shimeji use a photo of my pet?',
        answer:
          'A Shimeji needs prepared visual assets. A photo-based service is more direct when you only have a pet photo and do not want to draw animation frames.',
      },
      {
        question: 'What is a good Shimeji alternative for a pet owner?',
        answer:
          'If you want your own animal rather than a fictional character, look for a desktop pet made from a real pet photo. DeskBub offers that path for Windows and Mac.',
      },
    ],
    related: ['how-to-turn-a-pet-photo-into-a-desktop-pet', 'best-free-desktop-pets', 'how-to-make-a-desktop-pet'],
  },
  {
    slug: 'how-we-turned-kaka-into-a-desktop-pet',
    title: 'How We Turned Kaka Into a Desktop Pet',
    description:
      'See how a real photo of Kaka became a free animated dog that floats above Windows and Mac apps, plus what we learned about recognizable pet details.',
    category: 'Kaka Case Study',
    readingTime: '6 min read',
    publishedAt,
    updatedAt: publishedAt,
    eyebrow: 'The real dog behind DeskBub',
    intro:
      'Kaka was a real little dog before he was a desktop pet. We used his photo as the visual reference, turned that familiar appearance into transparent motion, and built the free DeskBub experience around him.',
    quickAnswer:
      'Kaka’s source photo gave us the identity to preserve. The finished animations had to remain recognizable at desktop size, float above normal apps, and be easy to hide when needed. He now comes free with DeskBub so anyone can try the experience before creating a custom pet.',
    keywords: [
      'dog desktop pet',
      'custom dog desktop pet',
      'dog desktop pet from photo',
      'real dog desktop companion',
      'free dog desktop pet',
    ],
    visual: 'kaka',
    sections: [
      {
        id: 'why-kaka',
        title: 'Why Kaka became the first DeskBub pet',
        paragraphs: [
          'A generic mascot can prove that animation works, but it cannot prove the idea that motivated DeskBub: a pet owner should be able to recognize the animal on screen. Kaka gave us a real identity and an honest test.',
          'His photo made the standard concrete. The desktop version needed to retain the face, coat color, ears, body shape, and gentle presence that made the real Kaka familiar.',
        ],
      },
      {
        id: 'photo',
        title: 'The source photo established identity',
        paragraphs: [
          'The original photograph shows Kaka clearly enough to understand his face, coat, proportions, and posture. Those details matter more than a decorative background because the desktop result is small and transparent.',
          'When choosing a photo for another dog, use the same principle: pick the image that best explains what makes that dog recognizable, not necessarily the most dramatic or professionally edited image.',
        ],
        bullets: [
          'Keep distinctive face and coat markings visible.',
          'Prefer a clear silhouette over a crowded scene.',
          'Avoid cropping the parts needed for the chosen movement.',
          'Use natural color so the generated pet has a reliable reference.',
        ],
      },
      {
        id: 'desktop',
        title: 'The result had to behave like a desktop pet',
        paragraphs: [
          'Kaka is not displayed inside a normal video player. His animation appears in a transparent window above other applications, which is what makes him feel present in the workspace.',
          'The app includes five Kaka actions, movement controls, size and opacity settings, water and stretch reminders, sharing tools, and a Show/Hide control. The ability to get out of the way is as important as the animation itself.',
        ],
      },
      {
        id: 'free',
        title: 'Why Kaka is included free',
        paragraphs: [
          'A custom desktop pet is difficult to understand from a promise alone. Kaka lets people test installation, motion, controls, and everyday fit before deciding whether their own pet belongs on screen.',
          'No account or payment is required for Kaka. A custom pet from your own photo is a separate one-time purchase starting at $1.',
        ],
        note: 'Try Kaka free. If the experience feels right, make the next desktop pet your own.',
      },
      {
        id: 'lesson',
        title: 'What Kaka taught us about custom pets',
        paragraphs: [
          'Likeness is not one feature. It comes from several visible decisions staying consistent: face, colors, outline, scale, motion, and the way the pet sits beside real applications.',
          'That is why DeskBub asks for a clear photo and treats the generated result as an interpretation. The goal is a familiar companion—not a generic dog with your pet’s name attached.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Kaka a real dog?',
        answer: 'Yes. Kaka is the real dog behind DeskBub, and his photo was the starting reference for the free animated desktop pet.',
      },
      {
        question: 'Is Kaka free?',
        answer: 'Yes. Kaka is included with DeskBub for Windows and Mac with no account or payment required.',
      },
      {
        question: 'Can I replace Kaka with my own dog?',
        answer: 'Yes. Upload a clear photo, create a custom pet, then pair it with the same DeskBub desktop app.',
      },
    ],
    related: ['how-to-turn-a-pet-photo-into-a-desktop-pet', 'how-to-make-a-cat-desktop-pet-from-a-photo', 'best-free-desktop-pets'],
  },
  {
    slug: 'how-to-make-a-cat-desktop-pet-from-a-photo',
    title: 'How to Make a Cat Desktop Pet From a Photo',
    description:
      'Choose a useful cat photo, preserve recognizable markings, generate movement, and put a custom cat desktop pet on Windows or Mac.',
    category: 'Cat Desktop Pet',
    readingTime: '7 min read',
    publishedAt,
    updatedAt: publishedAt,
    eyebrow: 'Your cat, visible on your desktop',
    intro:
      'A custom cat desktop pet should look connected to your cat—not merely like a cat of the same breed. The source photo needs to show the facial pattern, coat colors, body outline, ears, paws, and tail that make your cat recognizable.',
    quickAnswer:
      'Choose one clear photo of your cat, keep distinctive markings and the body outline visible, generate the animated action, review likeness and motion, then pair the approved pet with the Windows or Mac desktop app.',
    keywords: [
      'cat desktop pet',
      'custom cat desktop pet',
      'cat desktop pet from photo',
      'make my cat a desktop pet',
      'desktop cat Mac',
    ],
    visual: 'cat',
    sections: [
      {
        id: 'photo',
        title: 'Choose a photo that explains what your cat looks like',
        paragraphs: [
          'Cats can be difficult references because their paws may disappear under the body, tails may leave the frame, and dark or patterned fur can blend into the background. Start with a well-lit image where one cat is the clear subject.',
          'Look specifically at the face mask, nose, eye area, chest patch, socks, stripes, spots, ear shape, and tail. Those details often matter more for recognition than the breed label.',
        ],
        bullets: [
          'Use daylight or even indoor lighting without harsh color filters.',
          'Keep both eyes and the main facial markings visible.',
          'Include paws and tail when the desired action needs them.',
          'Avoid blankets or furniture with colors that merge into the coat.',
        ],
      },
      {
        id: 'action',
        title: 'Match the photo to the movement you want',
        paragraphs: [
          'A full-body standing or naturally sitting photo provides more information for walking and idle actions than a close facial portrait. A portrait can still explain identity, but the system must infer more of the hidden body.',
          'Long-haired cats, folded poses, costumes, and cropped tails may need extra interpretation. Review the result as a whole instead of assuming every pose will preserve every strand or marking perfectly.',
        ],
      },
      {
        id: 'review',
        title: 'Review likeness before focusing on animation polish',
        paragraphs: [
          'Check the face and coat pattern first. Then look at outline consistency, paw placement, tail continuity, and whether the cat changes shape during motion.',
          'At desktop size, the most important markings should remain readable. If the result resembles a generic cat more than your cat, try a cleaner source image rather than accepting motion that happens to look smooth.',
        ],
        steps: [
          { title: 'Identify', body: 'List the two or three features that make your cat unmistakable.' },
          { title: 'Photograph', body: 'Choose one image that shows those features without obstruction.' },
          { title: 'Generate', body: 'Create the action with the photo as the visual reference.' },
          { title: 'Check', body: 'Review markings, silhouette, motion, and readability at desktop size.' },
        ],
      },
      {
        id: 'install',
        title: 'Put the finished cat on Windows or Mac',
        paragraphs: [
          'After approving the custom result, pair it with the DeskBub desktop app. The pet appears in a transparent window above ordinary apps rather than playing inside a webpage or video player.',
          'Use the app controls to change movement, size, and opacity, or hide the pet when you need a clear screen. DeskBub supports Windows 10/11 and macOS 12 or later.',
        ],
      },
      {
        id: 'try',
        title: 'Try the desktop app before creating your cat',
        paragraphs: [
          'Kaka is a dog, but the free experience answers the practical questions that apply to any custom pet: how the window floats, whether the controls fit your routine, and whether you enjoy having a companion above your apps.',
          'Kaka is free with no account or payment. Creating your cat from a photo is a separate one-time custom purchase.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I make a desktop pet from one cat photo?',
        answer: 'Yes. Use a clear photo with visible facial markings and as much of the body outline as possible.',
      },
      {
        question: 'Does the cat need a plain background?',
        answer:
          'A perfectly plain background is not required, but strong contrast and little obstruction make the cat easier to identify and separate.',
      },
      {
        question: 'Can the custom cat run on Mac and Windows?',
        answer: 'Yes. The finished custom pet can be paired with the DeskBub app for Windows 10/11 or macOS 12 and later.',
      },
    ],
    related: ['how-to-turn-a-pet-photo-into-a-desktop-pet', 'how-we-turned-kaka-into-a-desktop-pet', 'how-to-get-a-desktop-pet-on-mac'],
  },
];

const unpublishedSeoGuideSlugs = new Set([
  'how-we-turned-kaka-into-a-desktop-pet',
  'how-to-make-a-cat-desktop-pet-from-a-photo',
]);

// Keep these drafts available for later revision without publishing routes or sitemap entries.
export const seoGuides = allSeoGuides.filter((guide) => !unpublishedSeoGuideSlugs.has(guide.slug));

export function getSeoGuide(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug);
}
