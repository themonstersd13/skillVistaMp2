import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, StatusBar, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import {
  User, Users, TrendingUp, Search,
  LayoutDashboard, Award, ChevronRight, ArrowLeft,
  BrainCircuit, Zap, LogIn
} from 'lucide-react-native';

import api from './api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#4F46E5',
  secondary: '#10B981',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  subtext: '#64748B',
  danger: '#EF4444',
  warning: '#F59E0B',
  border: '#E2E8F0'
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [cohortData, setCohortData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load dashboard data based on role
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        if (role === 'student') {
          const userRes = await api.getCurrentUser();
          if (!mounted) return;
          setCurrentUser(userRes);

          try {
            const reportRes = await api.getMyLatestReport();
            if (mounted) setLatestReport(reportRes);
          } catch (e) {
            if (mounted) setLatestReport(null); // no report yet
          }
        } else {
          const cohortRes = await api.getCohortData();
          if (mounted) setCohortData(cohortRes);
        }
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [role, isAuthenticated]);

  // Transform cohort data for standard shape
  const facultyStudents = useMemo(() => {
    return cohortData.map(s => ({
      id: String(s.student_id),
      name: s.name,
      status: s.status === 'green' ? 'On Track' : s.status === 'yellow' ? 'Fair' : 'At Risk',
      time: s.last_interview_date ? new Date(s.last_interview_date).toLocaleDateString() : 'Never',
      readiness: s.overall_readiness ? Math.round(s.overall_readiness) : 0,
      trend: s.overall_readiness >= 50 ? 'up' : 'down',
      trajectory: [s.overall_readiness || 0], // Simplification for now
      swot: {
        technical: [
          { label: "Technical", val: Math.round(s.technical_score || 0), desc: "Overall technical score" },
          { label: "Problem Solving", val: Math.round(s.technical_score || 0), desc: "Problem solving skills" }
        ],
        nonTechnical: [
          { label: "Behavioral", val: Math.round(s.behavioral_score || 0), desc: "Behavioral and team fit" },
          { label: "Communication", val: Math.round(s.communication_score || 0), desc: "Clarity and structure" }
        ]
      }
    }));
  }, [cohortData]);

  const filteredStudents = useMemo(() => {
    return facultyStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [facultyStudents, searchQuery]);

  const handleLogin = async (studentId) => {
    setLoading(true);
    try {
      await api.loginCandidate(studentId);
      setIsAuthenticated(true);
      setActiveTab('Home');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLatestReport(null);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} loading={loading} />;
  }

  // Current student formatted
  const studentDataFormatted = {
    name: currentUser?.name || 'Student',
    readiness: latestReport?.quantitative?.overall_readiness ? Math.round(latestReport.quantitative.overall_readiness) : 0,
    trajectory: [0, latestReport?.quantitative?.overall_readiness ? Math.round(latestReport.quantitative.overall_readiness) : 0],
    swot: {
      technical: [
        { label: "Technical", val: latestReport?.quantitative?.technical_score ? Math.round(latestReport.quantitative.technical_score) : 0, desc: "Technical accuracy" },
        { label: "Confidence", val: latestReport?.quantitative?.confidence_score ? Math.round(latestReport.quantitative.confidence_score) : 0, desc: "Confidence in technical answers" }
      ],
      nonTechnical: [
        { label: "Behavioral", val: latestReport?.quantitative?.behavioral_score ? Math.round(latestReport.quantitative.behavioral_score) : 0, desc: "Professional and situational awareness" },
        { label: "Communication", val: latestReport?.quantitative?.communication_score ? Math.round(latestReport.quantitative.communication_score) : 0, desc: "Clarity of communication" }
      ]
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.subtext }}>Syncing with SkillVista Cloud...</Text>
        </View>
      );
    }

    if (selectedStudent) return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;

    switch (activeTab) {
      case 'Home':
        return role === 'student' ? <StudentHome data={studentDataFormatted} /> :
               <FacultyHome students={filteredStudents} onSelect={setSelectedStudent} search={searchQuery} setSearch={setSearchQuery} />;
      case 'Analysis':
        return <AnalysisView data={role === 'student' ? studentDataFormatted : null} />;
      case 'Profile':
        return <ProfileView role={role} setRole={setRole} user={currentUser} onLogout={handleLogout} />;
      default:
        return <StudentHome data={studentDataFormatted} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>SKILLVISTA • {selectedStudent ? 'Analysis' : activeTab}</Text>
          <Text style={styles.headerTitle}>{role === 'student' ? 'My Progress' : 'Faculty Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => setRole(role === 'student' ? 'faculty' : 'student')}>
           {role === 'student' ? <BrainCircuit color={COLORS.primary} size={20} /> : <Users color={COLORS.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <View style={styles.mainView}>{renderContent()}</View>

      <View style={styles.navBar}>
        <NavBtn label="Home" icon={LayoutDashboard} active={activeTab === 'Home'} onPress={() => { setActiveTab('Home'); setSelectedStudent(null); }} />
        <NavBtn label="SWOT" icon={TrendingUp} active={activeTab === 'Analysis'} onPress={() => setActiveTab('Analysis')} />
        <NavBtn label="User" icon={User} active={activeTab === 'Profile'} onPress={() => setActiveTab('Profile')} />
      </View>
    </SafeAreaView>
  );
}

// --- SUB-VIEWS ---

function LoginScreen({ onLogin, loading }) {
  const [candidates, setCandidates] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getCandidates();
        setCandidates(res || []);
      } catch (err) {
        Alert.alert('Network Error', 'Ensure the backend is running on your machine and accessible.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, styles.centerBackground]}>
      <View style={styles.loginContainer}>
        <View style={styles.bigAvatar}>
          <Text style={{fontSize: 24, fontWeight: '900', color: COLORS.primary}}>SV</Text>
        </View>
        <Text style={styles.loginTitle}>SkillVista Mobile</Text>
        <Text style={styles.loginSub}>Select a candidate to begin demo</Text>
        
        {fetching ? (
           <ActivityIndicator color={COLORS.primary} />
        ) : (
          <ScrollView style={styles.loginScroll}>
            {candidates.map(c => (
              <TouchableOpacity key={c.id} style={styles.loginCard} onPress={() => onLogin(c.id)}>
                <View style={styles.rowCenter}>
                  <View style={styles.avatarCircleSmall}><Text style={styles.avatarText}>{c.name.charAt(0)}</Text></View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text }}>{c.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.subtext }}>{c.academic_year} • {c.target_role}</Text>
                  </View>
                </View>
                <LogIn size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
    </SafeAreaView>
  );
}

function StudentHome({ data }) {
  const hasData = data && data.readiness > 0;
  
  return (
    <ScrollView contentContainerStyle={styles.scrollPadding}>
      <View style={styles.readinessCard}>
        <Award color={COLORS.primary} size={32} />
        <Text style={styles.giantScore}>{data.readiness}%</Text>
        <Text style={styles.cardLabel}>Placement Readiness</Text>
        <View style={styles.barContainer}><View style={[styles.barFill, { width: `${data.readiness}%` }]} /></View>
      </View>
      
      {hasData ? (
        <>
          <Text style={styles.sectionTitle}>Skill Projection</Text>
          <LineChart data={{ labels: ["Prev", "Current"], datasets: [{ data: data.trajectory }] }} width={width - 40} height={180} chartConfig={chartConfig} bezier style={styles.roundedChart} />
        </>
      ) : (
        <View style={[styles.center, { marginTop: 40 }]}>
           <Text style={{color: COLORS.subtext}}>No interview data available yet.</Text>
           <Text style={{color: COLORS.subtext}}>Take a live interview on the web app!</Text>
        </View>
      )}
    </ScrollView>
  );
}

function FacultyHome({ students, onSelect, search, setSearch }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollPadding}>
      <View style={styles.searchBox}>
        <Search size={18} color={COLORS.subtext} />
        <TextInput placeholder="Search students..." style={styles.searchInput} value={search} onChangeText={setSearch} />
      </View>

      <Text style={styles.sectionTitle}>Cohort Overview</Text>
      {students.length === 0 ? (
         <Text style={{color: COLORS.subtext, textAlign: 'center', marginTop: 20}}>No students found.</Text>
      ) : (
        students.map((s) => (
          <TouchableOpacity key={s.id} style={styles.studentItem} onPress={() => onSelect(s)}>
            <View style={styles.rowCenter}>
              <View style={[styles.trendDot, { backgroundColor: s.trend === 'up' ? COLORS.secondary : COLORS.danger }]} />
              <View>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentMeta}>{s.readiness}% Readiness • {s.time}</Text>
              </View>
            </View>
            <ChevronRight color={COLORS.subtext} size={18} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function StudentDetailView({ student, onBack }) {
  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <ArrowLeft size={18} color={COLORS.primary} /><Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.detailName}>{student.name}</Text>
        <AnalysisView data={student} hideHeader />
      </ScrollView>
    </View>
  );
}

function AnalysisView({ data, hideHeader }) {
  if (!data || data.readiness === 0) return (
     <View style={[styles.center, {padding: 40}]}>
       <Text style={{color: COLORS.subtext, textAlign: 'center'}}>Incomplete Data: Complete an interview to generate SWOT analysis.</Text>
     </View>
  );

  const getInsight = (val) => {
    if (val >= 75) return { label: 'Strong', color: COLORS.secondary };
    if (val >= 50) return { label: 'Fair', color: COLORS.primary };
    return { label: 'At Risk', color: COLORS.danger };
  };

  const renderSection = (title, items) => (
    <View style={styles.sectionGap}>
      <Text style={styles.swotHeader}>{title}</Text>
      {items.map((item, i) => {
        const insight = getInsight(item.val);
        return (
          <View key={i} style={styles.infoCard}>
            <View style={styles.infoTop}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <View style={[styles.badge, { backgroundColor: insight.color + '20' }]}>
                <Text style={[styles.badgeText, { color: insight.color }]}>{insight.label}</Text>
              </View>
              <Text style={styles.infoVal}>{item.val}%</Text>
            </View>
            <Text style={styles.infoDesc}>{item.desc}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={!hideHeader && styles.scrollPadding}>
      {!hideHeader && <Text style={styles.sectionTitle}>AI Breakdown</Text>}
      {renderSection("Technical Benchmarks", data.swot.technical)}
      {renderSection("Behavioral Benchmarks", data.swot.nonTechnical)}
    </View>
  );
}

function ProfileView({ role, setRole, user, onLogout }) {
  return (
    <View style={styles.centerPadding}>
      <View style={styles.bigAvatar}><Zap size={32} color={COLORS.primary}/></View>
      <Text style={styles.profileTitle}>{role === 'student' ? user?.name || 'Student' : 'Faculty Admin'}</Text>
      <Text style={styles.profileSub}>{user?.academic_year || 'Faculty'} • {user?.target_role || 'Admin'}</Text>
      
      <TouchableOpacity style={styles.outlineBtn} onPress={() => setRole(role === 'student' ? 'faculty' : 'student')}>
         <Text style={styles.outlineText}>Switch to {role === 'student' ? 'Faculty' : 'Student'} View</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.outlineBtn, {borderColor: COLORS.danger, marginTop: 20}]} onPress={onLogout}>
         <Text style={[styles.outlineText, {color: COLORS.danger}]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- UTILS & STYLES ---

const NavBtn = ({ label, icon: Icon, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Icon color={active ? COLORS.primary : COLORS.subtext} size={22} />
    <Text style={[styles.navLabel, active && { color: COLORS.primary }]}>{label}</Text>
  </TouchableOpacity>
);

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  labelColor: () => COLORS.subtext,
  strokeWidth: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBackground: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: COLORS.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerSubtitle: { fontSize: 10, color: COLORS.subtext, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  avatarCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  mainView: { flex: 1 },
  scrollPadding: { padding: 20 },
  readinessCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  giantScore: { fontSize: 56, fontWeight: '900', color: COLORS.primary },
  cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.subtext },
  barContainer: { height: 6, width: '100%', backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.secondary },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 10, marginBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 15, borderRadius: 15, marginBottom: 20, height: 50, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 10, fontWeight: '500' },
  studentItem: { backgroundColor: COLORS.white, padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, elevation: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  trendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  studentName: { fontWeight: '700', fontSize: 16 },
  studentMeta: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backText: { color: COLORS.primary, fontWeight: '700', marginLeft: 8 },
  detailName: { fontSize: 26, fontWeight: '900', marginBottom: 20 },
  sectionGap: { marginBottom: 25 },
  swotHeader: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', marginBottom: 12 },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 12 },
  infoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontWeight: '700', flex: 1 },
  infoVal: { fontWeight: '900', color: COLORS.text, width: 45, textAlign: 'right' },
  infoDesc: { fontSize: 13, color: COLORS.subtext, lineHeight: 20 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  centerPadding: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  bigAvatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  profileTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  profileSub: { color: COLORS.subtext, marginTop: 5, textAlign: 'center' },
  outlineBtn: { marginTop: 40, padding: 15, width: '100%', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  outlineText: { color: COLORS.primary, fontWeight: '700' },
  navBar: { height: 80, backgroundColor: COLORS.white, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 10 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navLabel: { fontSize: 10, marginTop: 4, fontWeight: '700', color: COLORS.subtext },
  roundedChart: { borderRadius: 16, marginLeft: -20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Login Specific
  loginContainer: { width: '85%', backgroundColor: COLORS.white, borderRadius: 24, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, maxHeight: '80%' },
  loginTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', color: COLORS.text, marginBottom: 5 },
  loginSub: { fontSize: 14, color: COLORS.subtext, textAlign: 'center', marginBottom: 25 },
  loginScroll: { maxHeight: 300 },
  loginCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.background, padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  avatarCircleSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }
});