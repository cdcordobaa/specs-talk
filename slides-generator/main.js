document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdownInput');
    const generateBtn = document.getElementById('generateBtn');
    const slidesContainer = document.querySelector('.slides');
    
    let deck = new Reveal(document.querySelector('#slidesPreview'), {
        embedded: true,
        hash: true,
        mouseWheel: true,
        transition: 'slide'
    });
    
    deck.initialize();

    function generateSlides() {
        const content = markdownInput.value;
        const slides = content.split('---').map(s => s.trim());
        
        // Clear current slides
        slidesContainer.innerHTML = '';
        
        // Inject new slides
        slides.forEach(slideMarkdown => {
            const section = document.createElement('section');
            section.innerHTML = marked.parse(slideMarkdown);
            slidesContainer.appendChild(section);
        });

        // Re-sync Reveal.js
        deck.sync();
        deck.layout();
        deck.slide(0);
    }

    generateBtn.addEventListener('click', () => {
        // Simple animation feedback
        generateBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            generateBtn.style.transform = 'translateY(-2px)';
            generateSlides();
        }, 100);
    });

    // Initial generation
    generateSlides();
});
