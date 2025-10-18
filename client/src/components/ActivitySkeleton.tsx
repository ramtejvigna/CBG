import { Card, CardContent } from "@/components/ui/card"

interface ActivitySkeletonProps {
    theme: string
}

export const ActivitySkeleton = ({ theme }: ActivitySkeletonProps) => {
    return (
        <Card className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 rounded animate-pulse ${theme === "dark" ? "bg-gray-600" : "bg-gray-300"}`}></div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className={`h-5 rounded animate-pulse mb-2 w-3/4 ${theme === "dark" ? "bg-gray-600" : "bg-gray-300"}`}></div>
                                <div className={`h-4 rounded animate-pulse w-1/2 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <div className={`h-6 w-16 rounded animate-pulse ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                                <div className={`h-6 w-12 rounded animate-pulse ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-4 w-20 rounded animate-pulse ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                                <div className={`h-4 w-16 rounded animate-pulse ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                                <div className={`h-4 w-24 rounded animate-pulse ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                            </div>
                            <div className={`h-8 w-20 rounded animate-pulse ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const ActivityListSkeleton = ({ theme }: ActivitySkeletonProps) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <ActivitySkeleton key={index} theme={theme} />
            ))}
        </div>
    )
}