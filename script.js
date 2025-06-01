document.addEventListener('DOMContentLoaded', () => {
    // --- Burger menu ---
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('nav-active');
            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    // Assurez-vous que @keyframes navLinkFade est défini dans votre CSS
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
            burger.classList.toggle('toggle');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav && nav.classList.contains('nav-active')) {
                nav.classList.remove('nav-active');
                if (burger) burger.classList.remove('toggle');
                navLinks.forEach(l => l.style.animation = ''); // Reset animation
            }
        });
    });

    // --- Theme Switch ---
    const themeSwitch = document.getElementById('checkbox');
    const themeIcon = document.querySelector('.theme-icon');
    const currentTheme = localStorage.getItem('theme');

    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeSwitch) themeSwitch.checked = true;
            if (themeIcon) themeIcon.textContent = '🌙';
        } else {
            document.body.classList.remove('dark-mode');
            if (themeSwitch) themeSwitch.checked = false;
            if (themeIcon) themeIcon.textContent = '☀️';
        }
    }

    if (currentTheme) {
        setTheme(currentTheme);
    } else {
        // Préférence système si pas de choix utilisateur stocké
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            const selectedTheme = this.checked ? 'dark' : 'light';
            setTheme(selectedTheme);
            localStorage.setItem('theme', selectedTheme);
        });
    }
    
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) { // Uniquement si l'utilisateur n'a pas défini de thème manuellement
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // --- Koncept Assistant (Chatbot Simple Basé sur des Règles) ---
    const chatboxEl = document.getElementById('chatbox');
    const userInputEl = document.getElementById('userInput');
    const sendMessageBtnEl = document.getElementById('sendMessageBtn');

    function addMessageToChatbox(message, sender, isHtml = false) {
        if (!chatboxEl) return null;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        if (isHtml) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        chatboxEl.appendChild(messageDiv);
        chatboxEl.scrollTop = chatboxEl.scrollHeight;
        return messageDiv;
    }

    function getKonceptAssistantResponse(userMessage) {
        userMessage = userMessage.toLowerCase().trim();
        let response = "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler s'il vous plaît ?"; // Réponse par défaut

        const rules = [
            { pattern: /bonjour|salut|hello|coucou/i, answer: "Bonjour ! Je suis Koncept Assistant. Comment puis-je vous aider concernant l'IA aujourd'hui ?" },
            { pattern: /comment (vas-tu|allez-vous)/i, answer: "Je suis un programme informatique, toujours prêt à discuter d'IA ! Et vous, comment allez-vous ?" },
            { pattern: /quel est ton nom|qui es-tu/i, answer: "Je suis Koncept Assistant, votre guide virtuel pour explorer le monde de l'IA sur ce site." },
            { pattern: /(merci beaucoup|remercie)/i, answer: "De rien ! C'est un plaisir de vous assister." },
            { pattern: /au revoir|bye|ciao|à plus/i, answer: "Au revoir ! N'hésitez pas à revenir pour continuer votre exploration de l'IA." },
            { 
                pattern: /je m'appelle (\w+)/i, 
                answer: (matches) => `Enchanté, ${matches[1]} ! Que souhaitez-vous découvrir sur l'IA aujourd'hui ?` 
            },
            { 
                pattern: /mon nom est (\w+)/i, 
                answer: (matches) => `Ravi de vous connaître, ${matches[1]} ! Avez-vous des questions spécifiques sur l'intelligence artificielle ?` 
            },
            { pattern: /aide|aider|besoin d'aide/i, answer: "Bien sûr ! Je peux vous donner des informations sur les prémices, l'état actuel ou l'avenir de l'IA. Par exemple, demandez : 'Qu'est-ce que le Deep Learning ?' ou 'Parle-moi de la conférence de Dartmouth'."},
            { pattern: /machine learning|apprentissage automatique/i, answer: "Le Machine Learning est une branche de l'IA où les ordinateurs apprennent à partir de données pour effectuer des tâches sans être explicitement programmés. C'est la base de nombreuses applications, comme la reconnaissance d'images ou les recommandations."},
            { pattern: /deep learning|apprentissage profond/i, answer: "Le Deep Learning est un type de Machine Learning qui utilise des réseaux de neurones avec de nombreuses couches (profonds). Il est particulièrement efficace pour des tâches complexes comme la compréhension du langage naturel et la vision par ordinateur."},
            { pattern: /réseaux de neurones/i, answer: "Les réseaux de neurones sont des modèles informatiques inspirés par la structure et le fonctionnement du cerveau humain. Ils sont constitués de 'neurones' artificiels interconnectés qui traitent l'information."},
            { pattern: /genèse de l'ia|histoire de l'ia|débuts de l'ia|conférence de dartmouth/i, answer: "L'IA a des racines théoriques anciennes, mais le terme a été inventé lors de la conférence de Dartmouth en 1956, marquant son début comme champ de recherche. La section 'Prémices et Genèse' de ce site vous en dira plus !"},
            { pattern: /état actuel de l'ia|ia aujourd'hui|applications de l'ia/i, answer: "Aujourd'hui, l'IA est intégrée dans de nombreux domaines : assistants vocaux, suggestions de contenu, diagnostic médical, voitures autonomes, etc. La section 'État Actuel' de ce site explore ses applications et les défis actuels."},
            { pattern: /avenir de l'ia|futur de l'ia|ia de demain/i, answer: "L'avenir de l'IA est prometteur, avec des avancées attendues en IA Générale, collaboration homme-machine, et plus encore. Cependant, cela soulève aussi des questions éthiques importantes. Consultez la section 'Avenir' pour une perspective détaillée."},
            { pattern: /que penses-tu de l'ia|ton avis sur l'ia/i, answer: "En tant que Koncept Assistant, je trouve l'IA absolument fascinante ! C'est un outil incroyablement puissant qui a le potentiel de transformer notre monde de manière positive, à condition que son développement et son utilisation soient guidés par l'éthique et la responsabilité."},
            { pattern: /qu'est-ce que l'ia|définition ia|c'est quoi l'ia/i, answer: "L'Intelligence Artificielle (IA) est un vaste domaine de l'informatique qui vise à créer des systèmes capables de réaliser des tâches qui nécessiteraient normalement l'intelligence humaine, comme l'apprentissage, la résolution de problèmes, la perception, ou la prise de décision."},
            { pattern: /blague|raconte moi une blague|fais moi rire/i, answer: "Pourquoi le robot a-t-il rompu avec la calculatrice ? Parce qu'il ne pouvait plus compter sur elle ! ... J'espère que ça vous a plu !"}
        ];

        for (const rule of rules) {
            const match = userMessage.match(rule.pattern);
            if (match) {
                response = typeof rule.answer === 'function' ? rule.answer(match) : rule.answer;
                break; 
            }
        }
        return "🤖 " + response;
    }

    function handleSendMessage() {
        if (!userInputEl || !chatboxEl) return;

        const message = userInputEl.value.trim();
        if (message === '') return;

        addMessageToChatbox(message, 'user');
        userInputEl.value = ''; 

        setTimeout(() => {
            const botReply = getKonceptAssistantResponse(message);
            addMessageToChatbox(botReply, 'bot');
        }, 500 + Math.random() * 300);
    }

    if (document.getElementById('demo-ia')) { 
        if (sendMessageBtnEl && userInputEl && chatboxEl) {
            
            userInputEl.disabled = false;
            sendMessageBtnEl.disabled = false;

            addMessageToChatbox("🤖 Bonjour ! Je suis Koncept Assistant. Posez-moi une question sur l'IA ou explorez le site !", 'bot');
            if (userInputEl) userInputEl.focus(); // Mettre le focus sur l'input
            
            sendMessageBtnEl.addEventListener('click', handleSendMessage);
            userInputEl.addEventListener('keypress', function(event) {
                if (event.key === 'Enter' && !userInputEl.disabled) {
                    event.preventDefault(); 
                    handleSendMessage();
                }
            });
        } else {
            console.warn("Éléments du chatbot (Koncept Assistant) non trouvés. La démo ne fonctionnera pas.");
        }
    }
});