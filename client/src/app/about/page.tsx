"use client";

import React from 'react';
import { ArrowRight, Code, Trophy, Users, BookOpen, Zap, Laptop, Target, Globe, Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component

const AboutPage = () => {
    // Team developers data
    const developer = {
        name: "Vigna Ramtej Telagarapu",
        role: "Software Developer",
        image: "/images/Me.webp", // Update the path accordingly
        bio: "B.tech in Artificial Intelligence and Data Science with experience in Full Stack Web Developement and Data Science ",
        github: "https://github.com/ramtejvigna",
        twitter: "https://x.com/ramtejvigna46",
        linkedin: "https://www.linkedin.com/in/vignaramtej"
    }

    // Platform statistics
    const statistics = [
        { label: "Coding Battles", value: "1,500+", icon: Code },
        { label: "Active Warriors", value: "125K+", icon: Users },
        { label: "Certifications", value: "24", icon: Trophy },
        { label: "Languages", value: "12", icon: Globe }
    ];

    // Core values
    const coreValues = [
        {
            title: "Learn by Doing",
            description: "We believe the best way to master coding is through practical, hands-on challenges that push your limits.",
            icon: Laptop
        },
        {
            title: "Community Growth",
            description: "Our community thrives on collaboration, healthy competition, and knowledge sharing between coders of all levels.",
            icon: Users
        },
        {
            title: "Industry Relevance",
            description: "All our challenges and certifications are designed to reflect real-world problems and current industry practices.",
            icon: Target
        },
        {
            title: "Continuous Learning",
            description: "Technology evolves rapidly, and so do we. Our platform is constantly updated with new challenges and learning paths.",
            icon: BookOpen
        }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 pb-16">
            {/* Hero Section */}
            <div className="bg-gray-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-gray-900 py-20">
                <div className="container mx-auto px-8 max-w-5xl">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="md:w-3/5">
                            <h1 className="text-4xl font-bold mb-4 leading-tight">
                                Where Coders Become{" "}
                                <span className="bg-gradient-to-tr from-[#F14A00] to-[#C62300] bg-clip-text text-transparent">
                                    Warriors
                                </span>
                            </h1>
                            <p className="text-gray-400 text-lg mb-6">
                                CodeBattleGround was founded with a simple mission: transform coding education through competition, community, and real-world challenges.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/certifications" className="inline-flex items-center bg-gradient-to-tr from-[#F14A00] to-[#C62300] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-900/20 transition-all duration-300">
                                    Get Certified
                                    <ArrowRight size={16} className="ml-2" />
                                </Link>
                                <Link href="#" className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300">
                                    Join a Battle
                                </Link>
                            </div>
                        </div>
                        <div className="md:w-2/5 flex justify-center">
                            <div className="relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#F14A00] to-[#C62300] rounded-lg blur opacity-30 animate-pulse"></div>
                                <div className="relative bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <pre className="text-sm text-gray-300 font-mono">
                                        <span className="text-red-400">function</span>{" "}
                                        <span className="text-blue-400">becomeCodingWarrior</span>() &#123;<br />
                                        {"  "}
                                        <span className="text-purple-400">const</span> skills = [];<br />
                                        {"  "}
                                        <span className="text-purple-400">const</span> determination = <span className="text-green-400">true</span>;<br />
                                        {"  "}<br />
                                        {"  "}
                                        <span className="text-red-400">while</span> (determination) &#123;<br />
                                        {"    "}skills.<span className="text-blue-400">push</span>(<span className="text-orange-400">&apos;new knowledge&apos;</span>);<br />
                                        {"    "}
                                        <span className="text-red-400">if</span> (skills.<span className="text-blue-400">length</span> &gt; <span className="text-yellow-400">1000</span>) &#123;<br />
                                        {"      "}<span className="text-red-400">return</span>{" "}
                                        <span className="text-orange-400">&apos;Coding Warrior&apos;</span>;<br />
                                        {"    "}&#125;<br />
                                        {"  "}&#125;<br />
                                        &#125;
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="py-16 bg-gray-900">
                <div className="container mx-auto px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {statistics.map((stat, index) => (
                            <div key={index} className="flex flex-col items-center text-center">
                                <div className="bg-gray-800 p-4 rounded-full mb-4 border-2 border-gray-700">
                                    <stat.icon size={24} className="text-orange-500" />
                                </div>
                                <div className="text-3xl font-bold mb-1 bg-gradient-to-tr from-[#F14A00] to-[#C62300] bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Story Section
            <div className="py-16 bg-gray-800">
                <div className="container mx-auto px-8 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
                    <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
                        <p className="text-gray-300 mb-4">
                            CodeBattleGround began in 2020 when a group of competitive programmers saw a gap in how coding was being taught. Traditional tutorials and courses often lacked the excitement and real-world applications that make coding truly engaging.
                        </p>
                        <p className="text-gray-300 mb-4">
                            We created a platform where learning happens through carefully designed battles and challenges that simulate real-world problems. What started as a small community has grown into a thriving ecosystem of developers ranging from beginners to industry veterans.
                        </p>
                        <p className="text-gray-300">
                            Today, our certifications are recognized by leading tech companies, and our battle system has helped thousands of developers prepare for technical interviews, compete in hackathons, and build practical skills that transfer directly to their careers.
                        </p>
                    </div>
                </div>
            </div> */}

            {/* Core Values */}
            <div className="py-16 bg-gray-900">
                <div className="container mx-auto px-8 max-w-6xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {coreValues.map((value, index) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition-all duration-300">
                                <div className="p-3 bg-gray-700 rounded-lg inline-block mb-4">
                                    <value.icon size={24} className="text-orange-500" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                                <p className="text-gray-400 text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className="py-16 bg-gray-900">
                <div className="container mx-auto px-8 max-w-5xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">Developed by</h2>
                    <div className="grid grid-cols-1 items-center md:grid-cols-2 gap-8">
                        <Image
                            src={developer.image}
                            alt={developer.name}
                            width={240}
                            height={200}
                            className="rounded-full mx-auto mb-4 border-2 border-orange-500"
                        />
                        <div>
                            <h3 className="text-xl font-semibold mb-1">{developer.name}</h3>
                            <p className="text-orange-500 text-sm mb-4">{developer.role}</p>
                            <p className="text-gray-400 text-sm mb-6">{developer.bio}</p>
                            <div className="flex gap-4">
                                <a href={developer.github} className="text-gray-400 hover:text-white transition-colors duration-300">
                                    <Github size={18} />
                                </a>
                                <a href={developer.twitter} className="text-gray-400 hover:text-white transition-colors duration-300">
                                    <Twitter size={18} />
                                </a>
                                <a href={developer.linkedin} className="text-gray-400 hover:text-white transition-colors duration-300">
                                    <Linkedin size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-16 bg-gray-900">
                <div className="container mx-auto px-8 max-w-4xl">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-10 relative overflow-hidden border border-gray-600">
                        <div className="absolute inset-0 opacity-10 mix-blend-overlay"></div>
                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl font-bold mb-4">Ready to Join the Battle?</h2>
                            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                                Start your journey today and transform from a coder to a warrior. Challenge yourself, earn certifications, and join our community of passionate developers.
                            </p>
                            <Link href="#" className="inline-flex items-center bg-gradient-to-tr from-[#F14A00] to-[#C62300] text-white px-8 py-4 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-900/20 transition-all duration-300 text-lg">
                                Start Your First Battle
                                <Zap size={20} className="ml-2" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;