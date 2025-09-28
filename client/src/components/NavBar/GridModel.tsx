"uuse client"

import Link from "next/link"
import React, { useEffect, useRef } from "react"
import { Code, Award, MessageSquare, BarChart2, Terminal, Zap, Star, Activity } from "lucide-react"
import { useChallengesStore } from "@/lib/store/challengesStore"
import { useTheme } from "@/context/ThemeContext"

interface GridModelProps {
  onClose: () => void;
}

const GridModel = ({ onClose }: GridModelProps) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const categories = [
    {
      title: "Challenges",
      items: [
        { name: "Contests", icon: <Code className="w-4 h-4" />, href: "/contests" },
        { name: "Problems", icon: <Code className="w-4 h-4" />, href: "/challenges" },
      ],
    },
    {
      title: "Community",
      items: [
        { name: "Activity Feed", icon: <Activity className="w-4 h-4" />, href: "/activity-feed" },
        { name: "Rankings", icon: <Award className="w-4 h-4" />, href: "/rankings" },
      ],
    },
  ]
  
  const { challenges } = useChallengesStore((state) => state)

  const activeChallenges = React.useMemo(() => {
      if (!challenges || challenges.length === 0) return []
  
      // Sort challenges by createdAt (newest first)
      return challenges
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2) // Take only the 4 most recent challenges
        .map((challenge) => {
          // Calculate a fake "time left" based on createdAt (just for display purposes)
          const createdDate = new Date(challenge.createdAt)
          const now = new Date()
          const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
          const timeLeft =
            daysDiff < 1
              ? `${23 - now.getHours()}h ${59 - now.getMinutes()}m`
              : `${Math.max(7 - daysDiff, 1)}d ${23 - now.getHours()}h`
  
          // Calculate fake participants based on submissions count or a random number
          const participants = challenge.submissions || Math.floor(Math.random() * 300) + 100
  
          return {
            title: challenge.title,
            difficulty: challenge.difficulty,
            participants,
            timeLeft,
            likes: challenge.likes || 0, // Add likes property
          }
        })
    }, [challenges])

  return (
    <div 
      ref={modalRef}
      className={`absolute top-16 right-8 ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      } border shadow-xl rounded-lg w-[480px] z-50 animate-in fade-in-50 slide-in-from-top-5 duration-200`}
    >
      <div className="p-4">
        <div className="grid grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <div key={index} className="space-y-3">
              <h3 className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium text-sm`}>{category.title}</h3>
              <div className="space-y-1">
                {category.items.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`flex items-center p-2 rounded-md ${
                      theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    } transition-colors group`}
                  >
                    <span className={`${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    } group-hover:text-orange-500 transition-colors`}>{item.icon}</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    } text-sm`}>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-2 border-t ${
        theme === 'dark' 
          ? 'border-gray-800 bg-gradient-to-r from-gray-800/50 to-gray-800/20' 
          : 'border-gray-200 bg-gradient-to-r from-gray-100/50 to-gray-100/20'
      } px-4 py-3`}>
        <h3 className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium text-sm mb-2`}>Featured Challenges</h3>
        <div className="grid grid-cols-2 gap-3">
          {activeChallenges.map((challenge, idx) => (
            <div
              key={idx}
              className={`${
                theme === 'dark'
                  ? 'bg-gray-800/70 border-gray-700 hover:border-orange-500/30 hover:bg-gray-800'
                  : 'bg-gray-100/70 border-gray-200 hover:border-orange-500/30 hover:bg-gray-100'
              } rounded-md p-3 border cursor-pointer transition-all`}
            >
              <h4 className={`font-medium text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>{challenge.title}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                  {challenge.difficulty}
                </span>
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                } flex items-center`}>
                  <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                  {challenge.likes || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GridModel
