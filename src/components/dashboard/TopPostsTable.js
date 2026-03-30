export default function TopPostsTable({ posts }) {
    if (!posts || posts.length === 0) {
        return <p className="text-gray-500 text-center py-8">No posts yet</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Views</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Likes</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Comments</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map((post) => (
                        <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                                <a href={`${process.env.NEXT_PUBLIC_MAIN_SITE_URL}/blogs/${post.slug}`}
                                    target="_blank"
                                    className="text-gray-900 font-medium hover:text-blue-600">
                                    {post.title}
                                </a>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600">{post.view_count.toLocaleString()}</td>
                            <td className="text-center py-3 px-4 text-gray-600">{post.like_count.toLocaleString()}</td>
                            <td className="text-center py-3 px-4 text-gray-600">{post.comment_count.toLocaleString()}</td>
                            <td className="text-right py-3 px-4">
                                <a href={`/dashboard/author/posts/${post.id}/edit`}
                                    className="text-blue-600 hover:text-blue-800 text-sm">
                                    Edit
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}