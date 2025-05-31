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
            // Ne pas stocker localStorage ici, l'utilisateur n'a pas fait de choix actif
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
    
    // Écouter les changements de préférence système si l'utilisateur n'a pas fait de choix
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) { // Uniquement si l'utilisateur n'a pas défini de thème manuellement
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // --- Chatbot avec Transformers.js ---
    const chatboxML = document.getElementById('chatbox');
    const userInputML = document.getElementById('userInput');
    const sendMessageBtnML = document.getElementById('sendMessageBtn');
    let conversationPipeline = null;
    let isModelLoading = false;
    let modelLoadAttempted = false; // Pour éviter de multiples tentatives si échec

    function addMessageToChatbox(message, sender, isHtml = false) {
        if (!chatboxML) return null;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        if (isHtml) {
            messageDiv.innerHTML = message; // Attention: utiliser avec prudence si le contenu vient de l'utilisateur
        } else {
            messageDiv.textContent = message;
        }
        chatboxML.appendChild(messageDiv);
        chatboxML.scrollTop = chatboxML.scrollHeight; // Auto-scroll
        return messageDiv; // Retourne l'élément pour modification éventuelle (ex: message de chargement)
    }

    async function initializeChatbot() {
        if (isModelLoading || conversationPipeline || modelLoadAttempted) return; // Déjà en chargement, chargé ou tentative échouée
        
        isModelLoading = true;
        modelLoadAttempted = true; // Marquer qu'une tentative a eu lieu

        if (typeof Xenova === 'undefined') {
            addMessageToChatbox("Erreur: La bibliothèque Transformers.js n'a pas pu être chargée. Vérifiez votre connexion internet ou la console pour plus de détails.", 'bot');
            isModelLoading = false;
            if(userInputML) userInputML.disabled = true;
            if(sendMessageBtnML) sendMessageBtnML.disabled = true;
            return;
        }
        
        const { pipeline, env } = Xenova;
        env.allowLocalModels = true; 
        // env.useCache = true; // Cache activé par défaut, bon pour la prod
        // env.localModelPath = '/models/'; // Si vous hébergez les modèles localement
        // env.remoteHost = 'https://huggingface.co'; // Par défaut

        let loadingMessageElement = addMessageToChatbox(
            "Initialisation de l'assistant IA... <span class='loading-dots'><span>.</span><span>.</span><span>.</span></span><br><small>Le modèle est téléchargé dans votre navigateur. Cela peut prendre un moment la première fois.</small>", 
            'bot', 
            true // Contenu HTML
        );
        
        try {
            // Modèle conversationnel. 'Xenova/blenderbot_small-90M' ou 'Xenova/LaMini-Flan-T5-77M' sont de bonnes options légères.
            // Pour des modèles plus petits/rapides pour test : 'Xenova/ τότε tokenizer' (juste tokenizer, pas un modèle de génération)
            // Ou un modèle de question/réponse très léger si disponible.
            conversationPipeline = await pipeline('conversational', 'Xenova/blenderbot_small-90M', {
                quantized: true, // Essentiel pour la taille et la vitesse sur le web
                progress_callback: (progress) => {
                    // console.log('Chargement du modèle:', progress);
                    if (loadingMessageElement && progress.status === 'progress' && progress.file.includes('onnx')) { // onnx est souvent le fichier principal du modèle
                        const MBLoaded = Math.round(progress.loaded / 1024 / 1024 * 10) / 10;
                        const MBTotal = Math.round(progress.total / 1024 / 1024 * 10) / 10;
                        loadingMessageElement.innerHTML = `Chargement du modèle : ${progress.file} (${MBLoaded}MB / ${MBTotal}MB) <span class='loading-dots'><span>.</span><span>.</span><span>.</span></span><br><small>Veuillez patienter...</small>`;
                    } else if (loadingMessageElement && progress.status === 'ready') {
                        loadingMessageElement.innerHTML = `Modèle chargé. Préparation de l'assistant... <span class='loading-dots'><span>.</span><span>.</span><span>.</span></span>`;
                    }
                }
            });

            if(loadingMessageElement) loadingMessageElement.remove(); // Enlever le message de chargement
            addMessageToChatbox("🤖 Assistant IA prêt ! Vous pouvez me poser une question.", 'bot');
            if(userInputML) userInputML.disabled = false;
            if(sendMessageBtnML) sendMessageBtnML.disabled = false;
            if(userInputML) userInputML.focus();

        } catch (error) {
            console.error("Erreur d'initialisation du pipeline Transformers.js:", error);
            if(loadingMessageElement) loadingMessageElement.remove();
            addMessageToChatbox("Oups ! Impossible de charger l'assistant IA. <br><small>Détails techniques : " + error.message + "</small>", 'bot', true);
            if(userInputML) userInputML.disabled = true; // Laisser désactivé si erreur
            if(sendMessageBtnML) sendMessageBtnML.disabled = true;
        } finally {
            isModelLoading = false;
        }
    }

    async function handleSendMessageML() {
        if (!userInputML || !sendMessageBtnML || !chatboxML) return;

        if (!conversationPipeline && !isModelLoading) {
            addMessageToChatbox("L'assistant n'est pas initialisé. Tentative de démarrage...", 'bot');
            initializeChatbot(); // Tenter de (ré)initialiser
            return;
        }
        if (isModelLoading) {
             addMessageToChatbox("L'assistant est en cours de chargement, veuillez patienter...", 'bot');
            return;
        }
        if (!conversationPipeline) { // Si toujours pas de pipeline après tentative
            addMessageToChatbox("L'assistant n'a pas pu être chargé. Veuillez vérifier la console pour les erreurs.", 'bot');
            return;
        }


        const message = userInputML.value.trim();
        if (message === '') return;

        addMessageToChatbox(message, 'user');
        userInputML.value = '';
        userInputML.disabled = true;
        sendMessageBtnML.disabled = true;

        let thinkingMessageElement = addMessageToChatbox("🤖 <span class='loading-dots'><span>.</span><span>.</span><span>.</span></span>", 'bot', true);

        try {
            const result = await conversationPipeline(message);
            // La structure de 'result' dépend du pipeline.
            // Pour 'conversational' avec Xenova/blenderbot, c'est un objet avec `generated_text` et `conversation`
            // Ex: { generated_text: "I am doing well, how are you?", conversation: { past_user_inputs: [...], generated_responses: [...] } }
            // Parfois, c'est directement la chaîne de caractères.
            
            let botReply = "Je ne suis pas sûr de savoir quoi répondre à cela."; // Valeur par défaut

            if (typeof result === 'string') {
                botReply = result;
            } else if (result && result.generated_text) {
                botReply = result.generated_text;
            } else if (Array.isArray(result) && result.length > 0 && result[0] && result[0].generated_text) { // Pour certains pipelines renvoyant un tableau
                botReply = result[0].generated_text;
            }
            
            if(thinkingMessageElement) thinkingMessageElement.remove();
            addMessageToChatbox("🤖 " + botReply, 'bot');

        } catch (error) {
            console.error("Erreur lors de la génération de la réponse:", error);
            if(thinkingMessageElement) thinkingMessageElement.remove();
            addMessageToChatbox("🤖 Désolé, j'ai rencontré un problème pour répondre. <br><small>Erreur: " + error.message + "</small>", 'bot', true);
        } finally {
            userInputML.disabled = false;
            sendMessageBtnML.disabled = false;
            userInputML.focus();
        }
    }

    // Initialiser le chatbot uniquement si les éléments sont sur la page
    // et si la section démo est présente
    if (document.getElementById('demo-ia')) { 
        if (sendMessageBtnML && userInputML && chatboxML) {
            // On lance l'initialisation. 
            // Pourrait être déclenché par un clic sur un bouton "Activer la démo"
            // pour économiser des données/CPU si l'utilisateur ne veut pas l'utiliser.
            initializeChatbot(); 
            
            sendMessageBtnML.addEventListener('click', handleSendMessageML);
            userInputML.addEventListener('keypress', function(event) {
                if (event.key === 'Enter' && !userInputML.disabled) {
                    event.preventDefault(); 
                    handleSendMessageML();
                }
            });
        } else {
            console.warn("Éléments du chatbot (ML) non trouvés dans la section #demo-ia. La démo IA ne fonctionnera pas.");
        }
    }
});