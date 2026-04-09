import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, StatusBar, TextInput, Alert
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import {
  User, Users, TrendingUp, AlertCircle, Search,
  PlusCircle, LayoutDashboard, Award, ChevronRight, ArrowLeft,
  CheckCircle2, Zap, BrainCircuit
} from 'lucide-react-native';

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
  const [role, setRole] = useState('student');
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState([
    {
      id: '1', name: 'Srushti Garad', status: 'Completed', time: '2h ago',
      readiness: 84, trend: 'up', trajectory: [40, 65, 84],
      swot: {
        technical: [
          { label: "DSA", val: 95, desc: "Exceptional mastery of Graph & DP algorithms." },
          { label: "React Native", val: 88, desc: "Strong architecture skills in Expo/Redux." }
        ],
        nonTechnical: [
          { label: "Communication", val: 78, desc: "Clear, but needs focus on technical storytelling." },
          { label: "Leadership", val: 90, desc: "Proven track record in club management (CodeChef VP)." }
        ]
      }
    },
    {
      id: '2', name: 'Aman Verma', status: 'Completed', time: '5h ago',
      readiness: 62, trend: 'down', trajectory: [30, 45, 62],
      swot: {
        technical: [{ label: "Java", val: 70, desc: "Good basics, lacks multithreading depth." }],
        nonTechnical: [{ label: "Aptitude", val: 85, desc: "Fast problem solver in quant sections." }]
      }
    }
  ]);

  // Search logic for Faculty View
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, searchQuery]);

  const renderContent = () => {
    if (selectedStudent) return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;

    switch (activeTab) {
      case 'Home':
        return role === 'student' ? <StudentHome data={students[0]} /> :
               <FacultyHome students={filteredStudents} onSelect={setSelectedStudent} search={searchQuery} setSearch={setSearchQuery} />;
      case 'Analysis':
        return <AnalysisView data={role === 'student' ? students[0] : null} />;
      case 'Add':
        return <AddStudentForm onAdd={(name) => {
          const newS = { id: Date.now().toString(), name, status: 'Processing', time: 'Just now', readiness: 45, trend: 'up', trajectory: [45], swot: { technical: [], nonTechnical: [] } };
          setStudents([newS, ...students]);
          setActiveTab('Home');
          Alert.alert("AI Engine Started", `Analyzing ${name}'s GitHub and Profile...`);
        }} />;
      case 'Profile':
        return <ProfileView role={role} setRole={setRole} />;
      default:
        return <StudentHome data={students[0]} />;
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
        {role === 'faculty' && <NavBtn label="Add" icon={PlusCircle} active={activeTab === 'Add'} onPress={() => setActiveTab('Add')} />}
        <NavBtn label="User" icon={User} active={activeTab === 'Profile'} onPress={() => setActiveTab('Profile')} />
      </View>
    </SafeAreaView>
  );
}

// --- SUB-VIEWS ---

function StudentHome({ data }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollPadding}>
      <View style={styles.readinessCard}>
        <Award color={COLORS.primary} size={32} />
        <Text style={styles.giantScore}>{data.readiness}%</Text>
        <Text style={styles.cardLabel}>Placement Readiness</Text>
        <View style={styles.barContainer}><View style={[styles.barFill, { width: `${data.readiness}%` }]} /></View>
      </View>
      <Text style={styles.sectionTitle}>Skill Projection</Text>
      <LineChart data={{ labels: ["FY", "SY", "TY"], datasets: [{ data: data.trajectory }] }} width={width - 40} height={180} chartConfig={chartConfig} bezier style={styles.roundedChart} />
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
      {students.map((s) => (
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
      ))}
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
  if (!data) return <View style={styles.center}><Text>No Analysis Data</Text></View>;

  const getInsight = (val) => {
    if (val >= 90) return { label: 'Mastery', color: COLORS.secondary };
    if (val >= 75) return { label: 'Improving', color: COLORS.primary };
    return { label: 'Focus Required', color: COLORS.danger };
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

function AddStudentForm({ onAdd }) {
  const [name, setName] = useState('');
  return (
    <View style={styles.scrollPadding}>
      <Text style={styles.sectionTitle}>Add for Evaluation</Text>
      <View style={styles.whiteCard}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="Srushti Garad" value={name} onChangeText={setName} />
        <TouchableOpacity style={[styles.btn, !name && { opacity: 0.5 }]} onPress={() => name && onAdd(name)} disabled={!name}>
          <Text style={styles.btnText}>Launch Analysis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProfileView({ role, setRole }) {
  return (
    <View style={styles.centerPadding}>
      <View style={styles.bigAvatar}><Zap size={32} color={COLORS.primary}/></View>
      <Text style={styles.profileTitle}>{role === 'student' ? 'Srushti Garad' : 'Faculty Admin'}</Text>
      <Text style={styles.profileSub}>Walchand College of Engineering</Text>
      <TouchableOpacity style={styles.outlineBtn} onPress={() => setRole(role === 'student' ? 'faculty' : 'student')}>
         <Text style={styles.outlineText}>Switch to {role === 'student' ? 'Faculty' : 'Student'}</Text>
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

const StatCard = ({ label, val, icon: Icon, color }) => (
  <View style={styles.statBox}>
    <Icon color={color} size={22} />
    <Text style={styles.statBig}>{val}</Text>
    <Text style={styles.statSmall}>{label}</Text>
  </View>
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
  header: { padding: 20, backgroundColor: COLORS.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerSubtitle: { fontSize: 10, color: COLORS.subtext, fontWeight: '800', letterSpacing: 1.5 },
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
  whiteCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 25 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: COLORS.background, padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  btn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '800' },
  centerPadding: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  bigAvatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  profileTitle: { fontSize: 24, fontWeight: '900' },
  profileSub: { color: COLORS.subtext, marginTop: 5 },
  outlineBtn: { marginTop: 40, padding: 15, width: '100%', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  outlineText: { color: COLORS.primary, fontWeight: '700' },
  navBar: { height: 80, backgroundColor: COLORS.white, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 10 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navLabel: { fontSize: 10, marginTop: 4, fontWeight: '700', color: COLORS.subtext },
  roundedChart: { borderRadius: 16, marginLeft: -20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});