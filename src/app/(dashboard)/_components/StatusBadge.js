export default function StatusBadge({ status }) {
    const statusConfig = {
        PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800' },
        DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
        PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
        ARCHIVED: { label: 'Archived', color: 'bg-red-100 text-red-800' },
        SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
        ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
        INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
        SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
        BANNED: { label: 'Banned', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
        <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
            {config.label}
        </span>
    );
}