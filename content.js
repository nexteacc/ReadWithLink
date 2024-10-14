// content.js

let isReadingMode = false;
let originalContent;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
        sendResponse({status: "ready"});
    } else if (message.action === "toggleReadingMode") {
        try {
            toggleReadingMode();
            sendResponse({status: "Reading mode toggled successfully"});
        } catch (error) {
            console.error("Error toggling reading mode:", error);
            sendResponse({status: "Error", error: error.message});
        }
    }
    return true; 
});

function toggleReadingMode() {
    if (!isReadingMode) {
        enterReadingMode();
    } else {
        exitReadingMode();
    }
}

function enterReadingMode() {
    try {
        
        const article = new Readability(document.cloneNode(true)).parse();
        
        if (article) {
            originalContent = document.body.innerHTML;

            
            let cleanedContent = cleanNonContentLinks(article.content);
            cleanedContent = filterUnwantedSections(cleanedContent);  

           
            createReadingView(article.title, cleanedContent);

           
            populateLinks(cleanedContent);

            isReadingMode = true;
        } else {
            throw new Error('Unable to parse the main content of the page.');
        }
    } catch (error) {
        console.error('Error entering reading mode:', error);
        throw error; 
    }
}
function filterUnwantedSections(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

   
    const selectorsToRemove = [
        'nav',          
        'footer',      
        'aside',        
        '.related-posts', 
        '.more-articles', 
        '.feature-articles', 
        '.comments',    
        '.newsletter',  
    ];
    
    selectorsToRemove.forEach(selector => {
        const elements = tempDiv.querySelectorAll(selector);
        elements.forEach(element => element.remove());
    });


    const keywordSelectors = ['p', 'div', 'section'];
    const keywords = ['more articles', 'recommended', 'feature', '猜你喜欢', '更多推荐', 'Popular Stories','comments',
                      '相关文章', '相关内容', '评论', '广告', 'sponsored', 'feedback', 'newsletter'];

    keywordSelectors.forEach(tag => {
        const elements = tempDiv.querySelectorAll(tag);
        elements.forEach(element => {
            const text = element.textContent.toLowerCase();
            if (keywords.some(keyword => text.includes(keyword))) {
                element.remove();
            }
        });
    });

    return tempDiv.innerHTML;
}

function cleanNonContentLinks(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;


    const contentLinks = tempDiv.querySelectorAll('p a, h1 a, h2 a, h3 a, h4 a, h5 a, h6 a, li a');
    const allLinks = tempDiv.getElementsByTagName('a');

    for (let i = allLinks.length - 1; i >= 0; i--) {
        if (!Array.from(contentLinks).includes(allLinks[i])) {
            allLinks[i].parentNode.replaceChild(document.createTextNode(allLinks[i].textContent), allLinks[i]);
        }
    }

    return tempDiv.innerHTML;
}

function createReadingView(title, content) {
    const readingView = document.createElement('div');
    readingView.id = 'reading-mode-view';
    readingView.innerHTML = `
        <div id="reading-content">
            <h1>${title}</h1>
            ${content}
        </div>
        <div id="reading-sidebar">
            <h3>Links</h3>
            <ul id="content-links"></ul>
        </div>
    `;
    
    document.body.appendChild(readingView);
}

function populateLinks(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const links = Array.from(tempDiv.querySelectorAll('a')).filter(link => {
        const parentElement = link.parentElement;
        return parentElement.tagName === 'P' || 
               (parentElement.tagName === 'LI' && parentElement.closest('nav') === null);
    });
    
    const contentLinksList = document.getElementById('content-links');
    
    contentLinksList.innerHTML = ''; 
    
    links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${link.href}" target="_blank">${link.textContent}</a>`;
        contentLinksList.appendChild(li);
    });
}

function exitReadingMode() {
    try {
        const readingView = document.getElementById('reading-mode-view');
        if (readingView) {
            document.body.removeChild(readingView);
        }
        document.body.innerHTML = originalContent;
        isReadingMode = false;
    } catch (error) {
        console.error('Error exiting reading mode:', error);
        throw error; 
    }
}