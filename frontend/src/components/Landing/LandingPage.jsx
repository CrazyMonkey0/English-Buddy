import { createElement, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    AudioLines,
    BookOpen,
    BrainCircuit,
    Check,
    ChevronRight,
    MessageCircle,
    Mic,
    Sparkles,
    Target,
    Volume2,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import englishTalkImage from "../../assets/english-talk.webp";
import "./landing.css";

const availableFeatures = [
    {
        icon: MessageCircle,
        title: "Natural AI conversations",
        text: "Practice speaking through flowing, useful conversations instead of isolated exercises.",
        label: "Available",
    },
    {
        icon: Mic,
        title: "Voice-first practice",
        text: "Speak naturally, with speech recognition and AI voice responses designed for practice.",
        label: "Available",
    },
    {
        icon: Volume2,
        title: "Listen and respond",
        text: "Hear AI replies and build confidence in listening, rhythm and spoken English.",
        label: "Available",
    },
];

const roadmapFeatures = [
    {
        icon: BrainCircuit,
        title: "AI Conversation Simulator",
        text: "Explore interviews, meetings, travel and everyday situations with custom topics.",
    },
    {
        icon: Check,
        title: "Intelligent Grammar",
        text: "Understand corrections, identify patterns and learn more natural phrasing.",
    },
    {
        icon: Target,
        title: "Personal Learning Profile",
        text: "See recurring mistakes, strengths and recommendations shaped around you.",
    },
    {
        icon: BookOpen,
        title: "Smart Vocabulary",
        text: "Save useful words and revisit them in the contexts where you first met them.",
    },
];

function Brand() {
    return (
        <Link className="brand" to="/" aria-label="English Buddy home">
            <span className="brand-mark" aria-hidden="true">
                <span className="brand-mark-dot" />
                <span className="brand-mark-wave" />
            </span>
            <span>English <strong>Buddy</strong></span>
        </Link>
    );
}

function Companion() {
    return (
        <div
            className="companion-stage"
            aria-label="Friendly English Buddy AI companion"
        >
            <div className="companion-glow" />
            <div className="orbit orbit-one"><span /></div>
            <div className="orbit orbit-two"><span /></div>
            <div className="companion">
                <div className="companion-ear ear-left" />
                <div className="companion-ear ear-right" />
                <div className="companion-head">
                    <div className="companion-face">
                        <div className="companion-eye eye-left"><span /></div>
                        <div className="companion-eye eye-right"><span /></div>
                        <div className="companion-mouth" />
                    </div>
                </div>
                <div className="companion-neck" />
                <div className="companion-body">
                    <div className="body-core"><Sparkles size={22} /></div>
                </div>
            </div>
            <div className="status-chip status-top">
                <span className="status-dot" />
                Tutor ready
            </div>
            <div className="status-chip status-bottom">
                <AudioLines size={16} />
                Listening
            </div>
        </div>
    );
}

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const heroRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const elements = document.querySelectorAll("[data-reveal]");
        if (!("IntersectionObserver" in window)) {
            elements.forEach((element) => element.classList.add("is-visible"));
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    const startLearning = () => navigate("/chat");
    const handleHeroPointerMove = (event) => {
        if (event.pointerType === "touch" || !heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const rawX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const rawY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        const x = Math.max(-1, Math.min(1, rawX));
        const y = Math.max(-1, Math.min(1, rawY));
        heroRef.current.style.setProperty("--look-x", `${x * 6}px`);
        heroRef.current.style.setProperty("--look-y", `${y * 4}px`);
    };

    const resetHeroPointer = () => {
        if (!heroRef.current) return;
        heroRef.current.style.setProperty("--look-x", "0px");
        heroRef.current.style.setProperty("--look-y", "0px");
    };

    return (
        <div className="landing-page">
            <header className="landing-nav">
                <div className="landing-container nav-inner">
                    <Brand />
                    <button
                        className="menu-toggle"
                        type="button"
                        aria-expanded={menuOpen}
                        aria-controls="landing-navigation"
                        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span />
                        <span />
                    </button>
                    <nav id="landing-navigation" className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Main navigation">
                        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
                        <a href="#preview" onClick={() => setMenuOpen(false)}>Product</a>
                        <a href="#roadmap" onClick={() => setMenuOpen(false)}>Roadmap</a>
                        {isAuthenticated ? (
                            <button className="nav-button" type="button" onClick={startLearning}>Open Buddy</button>
                        ) : (
                            <Link className="nav-button" to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
                        )}
                    </nav>
                </div>
            </header>

            <main>
                <section
                    className="hero"
                    ref={heroRef}
                    onPointerMove={handleHeroPointerMove}
                    onPointerLeave={resetHeroPointer}
                >
                    <div className="hero-grid landing-container">
                        <div className="hero-copy" data-reveal>
                            <div className="eyebrow"><Sparkles size={14} /> Your personal AI language companion</div>
                            <h1>Speak English.<br /><span>Feel understood.</span></h1>
                            <p className="hero-description">
                                Practice real conversations, hear natural responses and build the confidence to speak English in everyday life.
                            </p>
                            <div className="hero-actions">
                                <button className="button button-primary" type="button" onClick={startLearning}>
                                    Start learning <ArrowRight size={18} />
                                </button>
                                <a className="button button-secondary" href="#features">
                                    Explore features
                                </a>
                            </div>
                            <div className="hero-proof">
                                <div className="proof-avatars" aria-hidden="true">
                                    <span>A</span><span>B</span><span>C</span>
                                </div>
                                <p><strong>Practice at your pace</strong><br />No pressure. Just progress.</p>
                            </div>
                        </div>
                        <div className="hero-visual" data-reveal>
                            <Companion />
                        </div>
                    </div>
                </section>

                <section className="intro section" id="about">
                    <div className="landing-container intro-grid">
                        <div className="section-heading" data-reveal>
                            <span className="section-kicker">A better way to learn</span>
                            <h2>Learn by doing,<br />not just reviewing.</h2>
                        </div>
                        <div className="intro-copy" data-reveal>
                            <p>
                                English grows stronger when you use it. English Buddy turns lessons into live conversations—giving you a safe space to try, listen and improve.
                            </p>
                            <div className="intro-points">
                                <span><Check size={16} /> Real conversation practice</span>
                                <span><Check size={16} /> Helpful, immediate feedback</span>
                                <span><Check size={16} /> Learning at your own pace</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="features section" id="features">
                    <div className="landing-container">
                        <div className="section-heading centered" data-reveal>
                            <span className="section-kicker">Available now</span>
                            <h2>Everything you need to start speaking</h2>
                            <p>Simple tools focused on one goal: helping you communicate with confidence.</p>
                        </div>
                        <div className="feature-grid">
                            {availableFeatures.map(({ icon: Icon, title, text, label }, index) => (
                                <article className="feature-card" key={title} data-reveal style={{ "--delay": `${index * 80}ms` }}>
                                    <div className="feature-icon">{createElement(Icon, { size: 24 })}</div>
                                    <span className="feature-label"><span />{label}</span>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                    <ChevronRight className="feature-arrow" size={18} />
                                </article>
                            ))}
                        </div>
                        <div className="under-development" data-reveal>
                            <Sparkles size={16} />
                            Grammar correction and personalized learning are part of the product roadmap.
                        </div>
                    </div>
                </section>

                <section className="preview section" id="preview">
                    <div className="landing-container preview-grid">
                        <div className="preview-copy" data-reveal>
                            <span className="section-kicker">Live conversation preview</span>
                            <h2>A friendly tutor, right when you need it.</h2>
                            <p>Practice naturally. English Buddy listens, responds and helps you turn mistakes into understanding.</p>
                            <ul className="preview-benefits">
                                <li><span><Mic size={17} /></span>Speak freely</li>
                                <li><span><BrainCircuit size={17} /></span>Receive a natural response</li>
                                <li><span><Target size={17} /></span>Learn from useful corrections</li>
                            </ul>
                        </div>
                        <div className="chat-window" data-reveal>
                            <img
                                className="chat-window-image"
                                src={englishTalkImage}
                                alt="English Buddy chat showing a correction and audio playback"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </section>

                <section className="how section">
                    <div className="landing-container">
                        <div className="section-heading centered" data-reveal>
                            <span className="section-kicker">How it works</span>
                            <h2>From first words to fluent conversations</h2>
                        </div>
                        <div className="steps">
                            {[
                                ["01", MessageCircle, "Choose a conversation", "Start with a topic or ask Buddy for a situation to practice."],
                                ["02", Mic, "Talk naturally", "Speak or type and respond the way you would in real life."],
                                ["03", Target, "Learn and improve", "Review helpful feedback and carry what you learn into the next conversation."],
                            ].map(([number, Icon, title, text], index) => (
                                <article className="step" key={number} data-reveal style={{ "--delay": `${index * 100}ms` }}>
                                    <span className="step-number">{number}</span>
                                    <div className="step-icon">{createElement(Icon, { size: 22 })}</div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="roadmap section" id="roadmap">
                    <div className="landing-container">
                        <div className="roadmap-heading" data-reveal>
                            <div className="section-heading">
                                <span className="section-kicker">Future roadmap</span>
                                <h2>Built for the learner you’re becoming.</h2>
                            </div>
                            <p>Our next capabilities are in development. Availability may evolve as English Buddy improves.</p>
                        </div>
                        <div className="roadmap-grid">
                            {roadmapFeatures.map(({ icon: Icon, title, text }, index) => (
                                <article className="roadmap-card" key={title} data-reveal style={{ "--delay": `${index * 70}ms` }}>
                                    <div className="roadmap-card-top">
                                        <div className="feature-icon">{createElement(Icon, { size: 21 })}</div>
                                        <span>Planned</span>
                                    </div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="final-cta">
                    <div className="cta-orb orb-left" />
                    <div className="cta-orb orb-right" />
                    <div className="landing-container cta-content" data-reveal>
                        <div className="cta-icon"><Sparkles size={24} /></div>
                        <h2>Your next conversation starts here.</h2>
                        <p>Build confidence one real sentence at a time.</p>
                        <button className="button button-primary" type="button" onClick={startLearning}>
                            Start learning <ArrowRight size={18} />
                        </button>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="landing-container footer-inner">
                    <div className="footer-brand">
                        <Brand />
                        <p>An AI companion for natural English practice.</p>
                    </div>
                    <nav className="footer-links" aria-label="Footer navigation">
                        <a href="#features">Features</a>
                        <a href="#preview">Product preview</a>
                        <a href="#roadmap">Roadmap</a>
                        <Link to="/chat">Open chat</Link>
                    </nav>
                    <p className="copyright">© {new Date().getFullYear()} English Buddy</p>
                </div>
            </footer>
        </div>
    );
}
