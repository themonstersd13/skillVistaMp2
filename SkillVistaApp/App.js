import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Dimensions, StatusBar, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import {
  User, Users, TrendingUp, Search,
  LayoutDashboard, Award, ChevronRight, BrainCircuit, Zap, LogIn
} from 'lucide-react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Main App Root ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on load
    const checkAuth = async () => {
      // For demo purposes, we will just start unauthenticated
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerBackground]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onAuthSuccess={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainFlow">
           {(props) => <MainFlow {...props} onLogout={() => setIsAuthenticated(false)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Main Flow (Tabs + Stack for Detail) ---
function MainFlow({ onLogout }) {
  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [cohortData, setCohortData] = useState([]);

  useEffect(() => {
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
            if (mounted) setLatestReport(null);
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
  }, [role]);

  const handleLogout = () => {
    api.clearAuthToken();
    onLogout();
  };

  // Switch between Faculty Tab Group and Student Tab Group dynamically
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
        headerTitleStyle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
        headerRight: () => (
          <TouchableOpacity style={[styles.avatarCircle, { marginRight: 15 }]} onPress={() => setRole(role === 'student' ? 'faculty' : 'student')}>
             {role === 'student' ? <BrainCircuit color={COLORS.primary} size={20} /> : <Users color={COLORS.primary} size={20} />}
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 10, borderTopColor: '#F1F5F9' }
      })}
    >
      {/* HOME TAB */}
      <Tab.Screen 
        name="Dashboard" 
        options={{
            title: role === 'student' ? 'My Progress' : 'Faculty Admin',
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />
        }}
      >
        {(props) => (
           <HomeStack 
             role={role} 
             currentUser={currentUser} 
             latestReport={latestReport} 
             cohortData={cohortData} 
             loading={loading} 
             {...props} 
           />
        )}
      </Tab.Screen>

      {/* SWOT TAB */}
      <Tab.Screen 
        name="Analysis" 
        options={{
            title: 'SWOT Analysis',
            tabBarIcon: ({ color }) => <TrendingUp color={color} size={22} />
        }}
      >
        {(props) => <AnalysisTab role={role} latestReport={latestReport} loading={loading} />}
      </Tab.Screen>

      {/* PROFILE TAB */}
      <Tab.Screen 
        name="Profile" 
        options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User color={color} size={22} />
        }}
      >
         {(props) => <ProfileView role={role} setRole={setRole} user={currentUser} onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// --- Home Stack (Allows navigating to Student Details for Faculty) ---
function HomeStack({ role, currentUser, latestReport, cohortData, loading }) {
  if (loading) {
     return <View style={styles.center}><ActivityIndicator color={COLORS.primary}/></View>;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === 'student' ? (
         <Stack.Screen name="StudentHomeOverview">
            {props => <StudentHome user={currentUser} report={latestReport} {...props} />}
         </Stack.Screen>
      ) : (
         <>
           <Stack.Screen name="FacultyDashboard">
              {props => <FacultyHome cohortData={cohortData} {...props} />}
           </Stack.Screen>
           <Stack.Screen name="FacultyStudentDetail" component={StudentDetailView} />
         </>
      )}
    </Stack.Navigator>
  );
}


// --- SUB-VIEWS ---

function LoginScreen({ onAuthSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getCandidates();
        setCandidates(res || []);
      } catch (err) {
        Alert.alert('Network Error', 'Ensure the backend is running and reachable.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  const handleLogin = async (id) => {
    setLoggingIn(true);
    try {
      await api.loginCandidate(id);
      onAuthSuccess();
    } catch (err) {
      Alert.alert("Login Failed", err.message);
      setLoggingIn(false);
    }
  };

  return (
    <View style={[styles.container, styles.centerBackground]}>
      <View style={styles.loginContainer}>
        <View style={styles.bigAvatar}>
          <Text style={{fontSize: 24, fontWeight: '900', color: COLORS.primary}}>SV</Text>
        </View>
        <Text style={styles.loginTitle}>SkillVista Mobile</Text>
        <Text style={styles.loginSub}>Select a candidate to begin</Text>
        
        {fetching ? (
           <ActivityIndicator color={COLORS.primary} />
        ) : (
          <ScrollView style={styles.loginScroll}>
            {candidates.map(c => (
              <TouchableOpacity key={c.id} style={styles.loginCard} onPress={() => handleLogin(c.id)}>
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
      {loggingIn && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
    </View>
  );
}

function StudentHome({ user, report }) {
  const readiness = report?.quantitative?.overall_readiness ? Math.round(report.quantitative.overall_readiness) : 0;
  return (
    <ScrollView contentContainerStyle={styles.scrollPadding}>
      <View style={styles.readinessCard}>
        <Award color={COLORS.primary} size={32} />
        <Text style={styles.giantScore}>{readiness}%</Text>
        <Text style={styles.cardLabel}>Placement Readiness</Text>
        <View style={styles.barContainer}><View style={[styles.barFill, { width: `${readiness}%` }]} /></View>
      </View>
      
      {readiness > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Skill Projection</Text>
          <LineChart data={{ labels: ["Prev", "Current"], datasets: [{ data: [0, readiness] }] }} width={width - 40} height={180} chartConfig={chartConfig} bezier style={styles.roundedChart} />
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

function FacultyHome({ cohortData, navigation }) {
  const [search, setSearch] = useState('');

  const facultyStudents = useMemo(() => {
    return cohortData.map(s => ({
      id: String(s.student_id),
      name: s.name,
      status: s.status === 'green' ? 'On Track' : s.status === 'yellow' ? 'Fair' : 'At Risk',
      time: s.last_interview_date ? new Date(s.last_interview_date).toLocaleDateString() : 'Never',
      readiness: s.overall_readiness ? Math.round(s.overall_readiness) : 0,
      trend: s.overall_readiness >= 50 ? 'up' : 'down',
      swot: {
        technical: [
          { label: "Technical", val: Math.round(s.technical_score || 0), desc: "Overall technical score" }
        ],
        nonTechnical: [
          { label: "Behavioral", val: Math.round(s.behavioral_score || 0), desc: "Behavioral and team fit" }
        ]
      }
    })).filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [cohortData, search]);

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.subtext} />
          <TextInput placeholder="Search students..." style={styles.searchInput} value={search} onChangeText={setSearch} />
        </View>

        <Text style={styles.sectionTitle}>Cohort Overview</Text>
        {facultyStudents.map((s) => (
          <TouchableOpacity key={s.id} style={styles.studentItem} onPress={() => navigation.navigate('FacultyStudentDetail', { student: s })}>
            <View style={styles.rowCenter}>
              <View style={[styles.trendDot, { backgroundColor: s.trend === 'up' ? COLORS.secondary : COLORS.danger }]} />
              <View>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentMeta}>{s.readiness}% Readiness • {s.time}</Text>
              </View>
            </View>
            <ChevronRight color={COLORS.subtext} size={18} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StudentDetailView({ route, navigation }) {
  const { student } = route.params;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
       <View style={{padding: 20, paddingBottom: 10, flexDirection: 'row', alignItems:'center'}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{padding:5, marginRight: 10, backgroundColor: COLORS.white, borderRadius: 10}}>
             <ArrowLeft size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={{fontSize: 20, fontWeight: '800'}}>{student.name}</Text>
       </View>
       <ScrollView contentContainerStyle={{padding: 20}}>
          <View style={{alignItems: 'center', marginBottom: 30}}>
             <Text style={{fontSize: 40, fontWeight: '900', color: COLORS.primary}}>{student.readiness}%</Text>
             <Text style={{color: COLORS.subtext, fontWeight: '600'}}>Overall Readiness</Text>
          </View>
          <RenderSWOT data={student.swot} />
       </ScrollView>
    </View>
  );
}

function AnalysisTab({ role, latestReport, loading }) {
  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  if (role !== 'student') return <View style={styles.center}><Text style={{color: COLORS.subtext}}>Select a student from the Dashboard to view their analysis.</Text></View>;

  const swot = {
    technical: [
      { label: "Technical", val: latestReport?.quantitative?.technical_score ? Math.round(latestReport.quantitative.technical_score) : 0, desc: "Technical accuracy" },
      { label: "Confidence", val: latestReport?.quantitative?.confidence_score ? Math.round(latestReport.quantitative.confidence_score) : 0, desc: "Confidence in technical answers" }
    ],
    nonTechnical: [
      { label: "Behavioral", val: latestReport?.quantitative?.behavioral_score ? Math.round(latestReport.quantitative.behavioral_score) : 0, desc: "Professional and situational awareness" },
      { label: "Communication", val: latestReport?.quantitative?.communication_score ? Math.round(latestReport.quantitative.communication_score) : 0, desc: "Clarity of communication" }
    ]
  };

  if(!latestReport) {
     return <View style={styles.center}><Text style={{color: COLORS.subtext}}>No analysis exists. Start an interview first.</Text></View>
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollPadding}>
       <Text style={styles.sectionTitle}>AI Breakdown</Text>
       <RenderSWOT data={swot} />
    </ScrollView>
  );
}

function RenderSWOT({ data }) {
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
    <View>
      {renderSection("Technical Benchmarks", data.technical)}
      {renderSection("Behavioral Benchmarks", data.nonTechnical)}
    </View>
  );
}

function ProfileView({ role, setRole, user, onLogout }) {
  return (
    <ScrollView contentContainerStyle={styles.centerPadding}>
      <View style={styles.bigAvatar}><Zap size={32} color={COLORS.primary}/></View>
      <Text style={styles.profileTitle}>{role === 'student' ? user?.name || 'Student' : 'Faculty Admin'}</Text>
      <Text style={styles.profileSub}>{user?.academic_year || 'Faculty'} • {user?.target_role || 'Admin'}</Text>
      
      <TouchableOpacity style={styles.outlineBtn} onPress={() => setRole(role === 'student' ? 'faculty' : 'student')}>
         <Text style={styles.outlineText}>Switch to {role === 'student' ? 'Faculty' : 'Student'} View</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.outlineBtn, {borderColor: COLORS.danger, marginTop: 20}]} onPress={onLogout}>
         <Text style={[styles.outlineText, {color: COLORS.danger}]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- UTILS & STYLES ---

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  labelColor: () => COLORS.subtext,
  strokeWidth: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBackground: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  avatarCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
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