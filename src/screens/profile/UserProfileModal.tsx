import { useAuth } from '@/App';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { StatusMessage } from '../../components/StatusMessage';

interface UserProfileModalProps {
    visible: boolean;
    userId: number;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, userId, onClose }) => {
    const { api } = useAuth()!;
    const { 
        data: profileData, 
        isLoading, 
        error, 
        refetch 
    } = useUserProfile(userId, visible);

    const handleClose = () => {
        onClose();
    };

    const formatRole = (role: string) => {
        return role.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'IN_PROGRESS': '#F39C12',
            'PENDING_REVIEW': '#3498DB',
            'COMPLETED': '#27AE60',
            'CANCELLED': '#E74C3C'
        };
        return colors[status] || '#95A5A6';
    };

    const getPriorityColor = (priority: string) => {
        const colors: { [key: string]: string } = {
            'LOW': '#27AE60',
            'MEDIUM': '#F39C12',
            'HIGH': '#E67E22',
            'URGENT': '#E74C3C'
        };
        return colors[priority] || '#95A5A6';
    };

    const getSeverityColor = (severity: string) => {
        const colors: { [key: string]: string } = {
            'LOW': '#27AE60',
            'MEDIUM': '#F39C12',
            'HIGH': '#E67E22',
            'CRITICAL': '#E74C3C'
        };
        return colors[severity] || '#27AE60';
    };

    const getPerformanceChartData = () => {
        if (!profileData?.performanceEvaluations?.length) {
            return null;
        }

        const evaluations = profileData.performanceEvaluations
            .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
            .slice(-6);

        return {
            labels: evaluations.map(evaluation => 
                new Date(evaluation.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            ),
            datasets: [
                {
                    data: evaluations.map(evaluation => evaluation.performance),
                    color: () => '#E74C3C',
                    strokeWidth: 2
                },
                {
                    data: evaluations.map(evaluation => evaluation.communication),
                    color: () => '#3498DB',
                    strokeWidth: 2
                },
                {
                    data: evaluations.map(evaluation => evaluation.teamwork),
                    color: () => '#27AE60',
                    strokeWidth: 2
                }
            ],
            legend: ['Performance', 'Communication', 'Teamwork']
        };
    };

    const chartData = getPerformanceChartData();
    const screenWidth = Dimensions.get('window').width;

    if (isLoading) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleClose}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>User Profile</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <View style={styles.statusOverlay}>
                        <StatusMessage 
                            isLoading={true}
                            isSuccess={false}
                            loadingMessage="Loading user profile..."
                            resultMessage=""
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    // Show error state
    if (error) {
        return (
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleClose}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>User Profile</Text>
                        <TouchableOpacity onPress={() => refetch()}>
                            <Text style={styles.retryButton}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statusOverlay}>
                        <StatusMessage 
                            isLoading={false}
                            isSuccess={false}
                            loadingMessage=""
                            resultMessage="Error loading profile!"
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    if (!profileData) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        {profileData.user.firstName} {profileData.user.lastName}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    {/* User Info Header */}
                    <View style={styles.userHeader}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitials}>
                                {profileData.user.firstName[0]}{profileData.user.lastName[0]}
                            </Text>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                                {profileData.user.firstName} {profileData.user.lastName}
                            </Text>
                            <Text style={styles.userEmail}>{profileData.user.email}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{formatRole(profileData.user.role)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Performance Stats */}
                    {profileData.performanceStats.totalEvaluations > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Performance Overview</Text>
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {profileData.performanceStats.overallAverage.toFixed(1)}/5
                                    </Text>
                                    <Text style={styles.statLabel}>Overall</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {profileData.performanceStats.avgPerformance.toFixed(1)}/5
                                    </Text>
                                    <Text style={styles.statLabel}>Performance</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {profileData.performanceStats.avgCommunication.toFixed(1)}/5
                                    </Text>
                                    <Text style={styles.statLabel}>Communi-cation</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {profileData.performanceStats.avgTeamwork.toFixed(1)}/5
                                    </Text>
                                    <Text style={styles.statLabel}>Teamwork</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Performance Chart */}
                    {chartData && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Performance Trends</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                                <LineChart
                                    data={chartData}
                                    width={screenWidth}
                                    height={220}
                                    yAxisInterval={1}
                                    yAxisSuffix=""
                                    yAxisLabel=""
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 1,
                                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        propsForDots: {
                                            r: "6",
                                            strokeWidth: "2",
                                            stroke: "#ffa726"
                                        }
                                    }}
                                    style={styles.chart}
                                />
                            </ScrollView>
                        </View>
                    )}

                    {/* Tasks Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Tasks ({profileData.tasks.length})</Text>
                        {profileData.tasks.length === 0 ? (
                            <View style={styles.emptySection}>
                                <Ionicons name="checkmark-circle-outline" size={32} color="#ccc" />
                                <Text style={styles.emptyText}>No tasks assigned</Text>
                            </View>
                        ) : (
                            profileData.tasks.slice(0, 5).map((task) => (
                                <View key={task.id} style={styles.taskCard}>
                                    <View style={styles.taskHeader}>
                                        <Text style={styles.taskTitle} numberOfLines={1}>
                                            {task.title}
                                        </Text>
                                        <View style={styles.taskBadges}>
                                            <View style={[styles.badge, { backgroundColor: getPriorityColor(task.priority) }]}>
                                                <Text style={styles.badgeText}>{task.priority}</Text>
                                            </View>
                                            <View style={[styles.badge, { backgroundColor: getStatusColor(task.status) }]}>
                                                <Text style={styles.badgeText}>{task.status}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.taskMeta}>
                                        <Text style={styles.taskMetaText}>
                                            Due: {formatDate(task.dueDate)}
                                        </Text>
                                        <Text style={styles.taskMetaText}>
                                            Assigned by: {task.assignerName}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Warnings Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Warnings ({profileData.warnings.length})</Text>
                        {profileData.warnings.length === 0 ? (
                            <View style={styles.emptySection}>
                                <Ionicons name="shield-checkmark-outline" size={32} color="#27AE60" />
                                <Text style={[styles.emptyText, { color: '#27AE60' }]}>
                                    No warnings on record
                                </Text>
                            </View>
                        ) : (
                            profileData.warnings.slice(0, 3).map((warning) => (
                                <View key={warning.id} style={styles.warningCard}>
                                    <View style={styles.warningHeader}>
                                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(warning.severity) }]}>
                                            <Text style={styles.severityText}>{warning.severity}</Text>
                                        </View>
                                        <Text style={styles.warningDate}>{formatDate(warning.issuedDate)}</Text>
                                    </View>
                                    <Text style={styles.warningReason} numberOfLines={2}>
                                        {warning.reason}
                                    </Text>
                                    <Text style={styles.warningAssigner}>
                                        Issued by: {warning.assignerName}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

        
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    retryButton: {
        fontSize: 16,
        color: '#E9435E',
        fontWeight: 'bold',
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E9435E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInitials: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: '#E9435E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    statItem: {
        flex: 1,
        minWidth: '22%',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E9435E',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    chart: {
        borderColor: '#e9ecef',
        borderWidth: 1,
        borderRadius: 16,
        alignSelf: 'center',
    },
    taskCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    taskBadges: {
        flexDirection: 'row',
        gap: 4,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '600',
        color: 'white',
    },
    taskMeta: {
        gap: 2,
    },
    taskMetaText: {
        fontSize: 11,
        color: '#666',
    },
    warningCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    warningHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'white',
    },
    warningDate: {
        fontSize: 11,
        color: '#666',
    },
    warningReason: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
        marginBottom: 6,
    },
    warningAssigner: {
        fontSize: 11,
        color: '#666',
    },
    emptySection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    statusOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 1000,
    },
});

export default UserProfileModal;