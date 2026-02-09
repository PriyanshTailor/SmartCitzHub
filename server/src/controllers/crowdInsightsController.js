import Report from '../models/Report.js'

export const getInsights = async (req, res) => {
    try {
        // Aggregation pipeline to group reports by location
        const insights = await Report.aggregate([
            {
                $group: {
                    _id: '$location_name',
                    count: { $sum: 1 },
                    latitude: { $first: '$latitude' },
                    longitude: { $first: '$longitude' },
                    last_reported: { $max: '$createdAt' }
                }
            },
            {
                $project: {
                    _id: 0,
                    location_name: '$_id',
                    count: 1,
                    latitude: 1,
                    longitude: 1,
                    last_reported: 1
                }
            }
        ])

        // Process insights to add density level
        const processedInsights = insights.map(insight => {
            let density_level = 'low';
            if (insight.count >= 5) {
                density_level = 'high';
            } else if (insight.count >= 3) {
                density_level = 'medium';
            }

            return {
                ...insight,
                density_level
            };
        });

        // If no data, return empty array (frontend handles fallback/empty state)
        // The user specifically asked for a JSON file "from which we can show the crowd insights data".
        // The plan includes a static JSON file for the frontend to fall back to or use if DB is empty.
        // However, the API should return what's in the DB.

        return res.json(processedInsights)

    } catch (error) {
        console.error('Get Crowd Insights Error:', error)
        res.status(500).json({ error: 'Failed to fetch crowd insights' })
    }
}
