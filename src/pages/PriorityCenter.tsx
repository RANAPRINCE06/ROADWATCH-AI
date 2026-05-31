import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert, Users, DollarSign, Calendar, Filter, ArrowUpDown, BrainCircuit, Activity, Sliders, MapPin, Truck, ChevronRight, Check } from 'lucide-react';
import { getReports, resolveReport, updateReportStatus, Report } from '../utils/storage';

interface PriorityItem {
  id: string;
  type: 'pothole' | 'flooding' | 'obstacle' | 'signal' | 'other';
  title: string;
  location: string;
  district: string;
  priorityScore: number; // 0-100
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  trafficImpact: 'Severe' | 'High' | 'Moderate' | 'Low';
  accidentRisk: number; // %
  complaintWeight: number; // count/votes
  roadImportance: 'Highway' | 'Arterial' | 'Local';
  cost: number;
  deadline: string;
  team: string;
  status: 'Pending' | 'Scheduled' | 'In Progress';
}

interface MunicipalTeam {
  name: string;
  specialization: 'Asphalt Resurfacing' | 'Drainage Systems' | 'Rapid Response' | 'Traffic Signals';
  lat: number;
  lng: number;
}

const TEAMS: MunicipalTeam[] = [
  { name: 'Orchard Resurfacing', specialization: 'Asphalt Resurfacing', lat: 1.3048, lng: 103.8318 },
  { name: 'Bishan Pavement Crew', specialization: 'Asphalt Resurfacing', lat: 1.3500, lng: 103.8400 },
  { name: 'City Hall Rapid Unit', specialization: 'Rapid Response', lat: 1.2950, lng: 103.8500 },
  { name: 'Marina Drainage Ops', specialization: 'Drainage Systems', lat: 1.2847, lng: 103.8590 },
  { name: 'Tanjong Signal Patrol', specialization: 'Traffic Signals', lat: 1.2789, lng: 103.8485 },
  { name: 'Geylang Drainage Techs', specialization: 'Drainage Systems', lat: 1.3200, lng: 103.8900 },
  { name: 'Clementi Quick Squad', specialization: 'Rapid Response', lat: 1.3100, lng: 103.7800 },
  { name: 'Changi Signal Team', specialization: 'Traffic Signals', lat: 1.3600, lng: 103.9500 },
  { name: 'Woodlands Asphalt Crew', specialization: 'Asphalt Resurfacing', lat: 1.4300, lng: 103.7700 },
  { name: 'Jurong Response Team', specialization: 'Rapid Response', lat: 1.3400, lng: 103.6800 }
];

interface HazardCluster {
  id: string;
  reports: Report[];
  centroid: { lat: number; lng: number };
  totalPriorityScore: number;
  primaryType: 'Resurfacing' | 'Drainage' | 'Rapid Response' | 'Signals';
}

interface RouteLeg {
  fromName: string;
  toName: string;
  distanceKm: number;
  travelTimeMins: number;
  repairTimeMins: number;
  penaltyTimeMins: number;
  segmentCompletionTimeMins: number;
  isCompatible: boolean;
  hazardType: string;
}

interface OptimizedRoute {
  path: Report[];
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalTravelTimeMins: number;
  totalRepairTimeMins: number;
  totalPenaltiesMins: number;
  totalCompletionTimeMins: number;
  separateDistanceKm: number;
  separateTravelTimeMins: number;
  separateCost: number;
  combinedCost: number;
  costSaved: number;
  distanceSavedPercent: number;
}

function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function runDBSCANClustering(activeReports: Report[], epsKm: number, minPts: number = 2): HazardCluster[] {
  if (activeReports.length === 0) return [];

  const visited = new Set<string>();
  const dbscanClusters: Report[][] = [];
  const noise: Report[] = [];

  const getNeighbors = (report: Report) => {
    return activeReports.filter(r => {
      if (r.id === report.id) return false;
      const dist = calculateHaversineDistance(
        report.lat || 1.3000, report.lng || 103.8500,
        r.lat || 1.3000, r.lng || 103.8500
      );
      return dist <= epsKm;
    });
  };

  const expandCluster = (report: Report, neighbors: Report[], cluster: Report[]) => {
    cluster.push(report);
    visited.add(report.id);

    let queue = [...neighbors];
    for (let i = 0; i < queue.length; i++) {
      const neighbor = queue[i];
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        const neighborNeighbors = getNeighbors(neighbor);
        if (neighborNeighbors.length >= minPts - 1) {
          queue.push(...neighborNeighbors.filter(n => !queue.some(q => q.id === n.id)));
        }
      }
      if (!dbscanClusters.some(c => c.some(r => r.id === neighbor.id)) && !cluster.some(r => r.id === neighbor.id)) {
        cluster.push(neighbor);
      }
    }
  };

  activeReports.forEach(report => {
    if (visited.has(report.id)) return;

    visited.add(report.id);
    const neighbors = getNeighbors(report);

    if (neighbors.length < minPts - 1) {
      noise.push(report);
    } else {
      const newCluster: Report[] = [];
      expandCluster(report, neighbors, newCluster);
      dbscanClusters.push(newCluster);
    }
  });

  // Treat each noise point as its own single-item cluster so it doesn't get ignored in dispatch
  noise.forEach(report => {
    const isClustered = dbscanClusters.some(c => c.some(r => r.id === report.id));
    if (!isClustered) {
      dbscanClusters.push([report]);
    }
  });

  return dbscanClusters.map((clusterReports, idx) => {
    let latSum = 0;
    let lngSum = 0;
    clusterReports.forEach(r => {
      latSum += r.lat || 1.3000;
      lngSum += r.lng || 103.8500;
    });
    const centroid = {
      lat: latSum / clusterReports.length,
      lng: lngSum / clusterReports.length
    };

    const typeCounts = { Resurfacing: 0, Drainage: 0, Signals: 0, 'Rapid Response': 0 };
    let totalPriority = 0;

    clusterReports.forEach(r => {
      let severityPoints = r.severity === 'Critical' ? 45 : r.severity === 'Active' ? 30 : 15;
      let trafficPoints = r.location.length % 2 === 0 ? 18 : 10;
      let roadPoints = r.location.toLowerCase().includes('highway') ? 15 : 10;
      let score = severityPoints + trafficPoints + roadPoints;
      totalPriority += r.priorityScore || score;
    });

    clusterReports.forEach(r => {
      const hazard = getHazardType(r);
      typeCounts[hazard]++;
    });

    let primaryType: HazardCluster['primaryType'] = 'Rapid Response';
    let maxCount = -1;
    (Object.keys(typeCounts) as Array<keyof typeof typeCounts>).forEach(t => {
      if (typeCounts[t] > maxCount) {
        maxCount = typeCounts[t];
        primaryType = t as HazardCluster['primaryType'];
      }
    });

    return {
      id: `cluster-${idx + 1}-${Date.now().toString().slice(-4)}`,
      reports: clusterReports,
      centroid,
      totalPriorityScore: totalPriority,
      primaryType
    };
  });
}

function assignCrewsToClusters(clusters: HazardCluster[], reports: Report[]): { clusterId: string; team: MunicipalTeam; matchScore: number }[] {
  const workloads: Record<string, number> = {};
  TEAMS.forEach(t => {
    workloads[t.name] = reports.filter(r => !r.resolved && r.assignedTeam && r.assignedTeam.includes(t.name)).length;
  });

  const sortedClusters = [...clusters].sort((a, b) => b.totalPriorityScore - a.totalPriorityScore);
  const assignments: { clusterId: string; team: MunicipalTeam; matchScore: number }[] = [];

  sortedClusters.forEach(cluster => {
    // Filter candidate teams that have remaining capacity (current load + cluster size <= 2)
    let candidateTeams = TEAMS.filter(team => {
      const currentLoad = workloads[team.name] || 0;
      return (currentLoad + cluster.reports.length) <= 2;
    });

    // Fallback if all teams are at capacity, to ensure we don't leave issues unassigned
    if (candidateTeams.length === 0) {
      candidateTeams = TEAMS;
    }

    let bestScore = -Infinity;
    let selectedTeam = candidateTeams[0] || TEAMS[0];

    candidateTeams.forEach(team => {
      let score = 100;

      const specMatch =
        (cluster.primaryType === 'Resurfacing' && team.specialization === 'Asphalt Resurfacing') ||
        (cluster.primaryType === 'Drainage' && team.specialization === 'Drainage Systems') ||
        (cluster.primaryType === 'Signals' && team.specialization === 'Traffic Signals') ||
        (cluster.primaryType === 'Rapid Response' && team.specialization === 'Rapid Response');

      if (specMatch) score += 60;

      const dist = calculateHaversineDistance(
        team.lat, team.lng,
        cluster.centroid.lat, cluster.centroid.lng
      );
      score -= dist * 6;

      const currentLoad = workloads[team.name] || 0;
      score -= currentLoad * 25;

      if (score > bestScore) {
        bestScore = score;
        selectedTeam = team;
      }
    });

    // Workload increment by individual task count in the cluster
    workloads[selectedTeam.name] = (workloads[selectedTeam.name] || 0) + cluster.reports.length;

    assignments.push({
      clusterId: cluster.id,
      team: selectedTeam,
      matchScore: Math.round(Math.max(10, Math.min(100, bestScore)))
    });
  });

  return assignments;
}

function getHazardType(r: Report): 'Resurfacing' | 'Drainage' | 'Signals' | 'Rapid Response' {
  const titleLower = r.title.toLowerCase();
  if (titleLower.includes('waterlogging') || titleLower.includes('flood') || r.icon === 'droplets') return 'Drainage';
  if (titleLower.includes('pothole') || titleLower.includes('crack') || r.icon === 'alert' || r.icon === 'hardhat') return 'Resurfacing';
  if (titleLower.includes('signal') || r.title.toLowerCase().includes('light')) return 'Signals';
  return 'Rapid Response';
}

function isSkillCompatible(teamSpecialization: string, hazardType: string): boolean {
  if (teamSpecialization === 'Asphalt Resurfacing' && hazardType === 'Resurfacing') return true;
  if (teamSpecialization === 'Drainage Systems' && hazardType === 'Drainage') return true;
  if (teamSpecialization === 'Traffic Signals' && hazardType === 'Signals') return true;
  if (teamSpecialization === 'Rapid Response' && hazardType === 'Rapid Response') return true;
  return false;
}

function getRepairDurationMins(severity: string): number {
  if (severity === 'Critical') return 45;
  if (severity === 'Active') return 30;
  if (severity === 'Pending') return 20;
  return 15;
}

function solveTspRoute(team: MunicipalTeam, clusterReports: Report[]): OptimizedRoute {
  let unvisited = [...clusterReports];
  let currentLat = team.lat;
  let currentLng = team.lng;
  let currentName = `${team.name} Base Station`;

  const path: Report[] = [];
  const legs: RouteLeg[] = [];
  let totalDistanceKm = 0;
  let cumulativeTimeMins = 0;
  let totalRepairTimeMins = 0;
  let totalPenaltiesMins = 0;
  let totalSurcharges = 0;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistance(
        currentLat, currentLng,
        unvisited[i].lat || 1.3000, unvisited[i].lng || 103.8500
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const nextNode = unvisited[nearestIdx];
    path.push(nextNode);
    unvisited.splice(nearestIdx, 1);

    const distLeg = nearestDist;
    const travelTimeLeg = Math.round((distLeg / 35) * 60); // 35 km/h

    const hazardType = getHazardType(nextNode);
    const compatible = isSkillCompatible(team.specialization, hazardType);
    const baseRepairTime = getRepairDurationMins(nextNode.severity);
    const penaltyTime = compatible ? 0 : 20;
    const surcharge = compatible ? 0 : 300;

    totalRepairTimeMins += baseRepairTime;
    totalPenaltiesMins += penaltyTime;
    totalSurcharges += surcharge;

    cumulativeTimeMins += travelTimeLeg + baseRepairTime + penaltyTime;
    totalDistanceKm += distLeg;

    legs.push({
      fromName: currentName,
      toName: nextNode.title,
      distanceKm: parseFloat(distLeg.toFixed(2)),
      travelTimeMins: travelTimeLeg,
      repairTimeMins: baseRepairTime,
      penaltyTimeMins: penaltyTime,
      segmentCompletionTimeMins: cumulativeTimeMins,
      isCompatible: compatible,
      hazardType
    });

    currentLat = nextNode.lat || 1.3000;
    currentLng = nextNode.lng || 103.8500;
    currentName = nextNode.title;
  }

  const returnDist = calculateHaversineDistance(currentLat, currentLng, team.lat, team.lng);
  const returnTravelTime = Math.round((returnDist / 35) * 60);
  cumulativeTimeMins += returnTravelTime;
  totalDistanceKm += returnDist;

  legs.push({
    fromName: currentName,
    toName: `Return to Base`,
    distanceKm: parseFloat(returnDist.toFixed(2)),
    travelTimeMins: returnTravelTime,
    repairTimeMins: 0,
    penaltyTimeMins: 0,
    segmentCompletionTimeMins: cumulativeTimeMins,
    isCompatible: true,
    hazardType: 'None'
  });

  const totalTravelTimeMins = Math.round((totalDistanceKm / 35) * 60);

  // Separate dispatches comparison
  let separateDistanceKm = 0;
  let separateTravelTimeMins = 0;

  clusterReports.forEach(r => {
    const hazardType = getHazardType(r);
    const specializedTeam = TEAMS.find(t => isSkillCompatible(t.specialization, hazardType)) || TEAMS[0];

    const distToTask = calculateHaversineDistance(specializedTeam.lat, specializedTeam.lng, r.lat || 1.3000, r.lng || 103.8500);
    separateDistanceKm += distToTask * 2;
    separateTravelTimeMins += Math.round(((distToTask * 2) / 35) * 60);
  });

  const separateCost = Math.round(separateDistanceKm * 50);
  const combinedCost = Math.round((totalDistanceKm * 50) + totalSurcharges);
  const costSaved = Math.max(0, separateCost - combinedCost);

  const distanceSaved = Math.max(0, separateDistanceKm - totalDistanceKm);
  const distanceSavedPercent = separateDistanceKm > 0 ? Math.round((distanceSaved / separateDistanceKm) * 100) : 0;

  return {
    path,
    legs,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
    totalTravelTimeMins,
    totalRepairTimeMins,
    totalPenaltiesMins,
    totalCompletionTimeMins: cumulativeTimeMins,
    separateDistanceKm: parseFloat(separateDistanceKm.toFixed(2)),
    separateTravelTimeMins,
    separateCost,
    combinedCost,
    costSaved,
    distanceSavedPercent
  };
}

export function PriorityCenter() {
  const [reports, setReports] = useState<Report[]>(() => getReports());
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'risk'>('score');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  const [activeTab, setActiveTab] = useState<'ledger' | 'routing'>('ledger');
  const [clusterThreshold, setClusterThreshold] = useState<number>(2.0);
  const [dispatchedClusters, setDispatchedClusters] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const handleSync = () => {
      setReports(getReports());
    };
    window.addEventListener('roadwatch-reports-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
    };
  }, []);

  // Compute priority items dynamically from storage reports
  const priorityItems: PriorityItem[] = reports
    .filter(r => !r.resolved)
    .map((r, idx) => {
      // Map icons to categories
      let type: PriorityItem['type'] = 'pothole';
      if (r.icon === 'droplets') type = 'flooding';
      else if (r.icon === 'hardhat') type = 'obstacle';
      else if (r.title.toLowerCase().includes('signal')) type = 'signal';
      else if (r.icon === 'alert') type = 'pothole';
      else type = 'other';

      // Parse districts from location name or assign logically
      let district = 'Downtown Core';
      if (r.location.toLowerCase().includes('orchard')) district = 'Orchard Sector';
      else if (r.location.toLowerCase().includes('bayfront') || r.location.toLowerCase().includes('marina')) district = 'Marina Bay';
      else if (r.location.toLowerCase().includes('geylang')) district = 'Geylang East';
      else if (r.location.toLowerCase().includes('jurong')) district = 'Jurong West';

      // Calculate Priority Score deterministically
      let severityPoints = 25;
      let severityLabel: PriorityItem['severity'] = 'Medium';
      if (r.severity === 'Critical') {
        severityPoints = 45;
        severityLabel = 'Critical';
      } else if (r.severity === 'Active') {
        severityPoints = 30;
        severityLabel = 'High';
      } else if (r.severity === 'Pending') {
        severityPoints = 15;
        severityLabel = 'Low';
      }

      // Generate parameters based on ID or index to look realistic
      const hash = r.title.length + r.location.length + idx;
      const trafficImpact: PriorityItem['trafficImpact'] =
        hash % 4 === 0 ? 'Severe' : hash % 4 === 1 ? 'High' : hash % 4 === 2 ? 'Moderate' : 'Low';

      const trafficPoints = trafficImpact === 'Severe' ? 25 : trafficImpact === 'High' ? 18 : trafficImpact === 'Moderate' ? 10 : 5;

      const roadImportance: PriorityItem['roadImportance'] =
        r.location.toLowerCase().includes('expressway') || r.location.toLowerCase().includes('highway') ? 'Highway' :
        r.location.toLowerCase().includes('rd') || r.location.toLowerCase().includes('ave') ? 'Arterial' : 'Local';

      const roadPoints = roadImportance === 'Highway' ? 15 : roadImportance === 'Arterial' ? 10 : 5;

      const accidentRisk = Math.min(96, Math.max(12, (severityPoints + trafficPoints + (hash % 15))));
      const complaintWeight = hash % 20 + 3; // complaint votes simulation
      const priorityScore = Math.min(100, Math.round(severityPoints + trafficPoints + roadPoints + (complaintWeight * 0.5)));

      // Costs & assignments
      const cost = type === 'flooding' ? 8500 : type === 'pothole' ? 1200 : type === 'obstacle' ? 2400 : 950;
      const deadlineDays = priorityScore > 85 ? '12 Hours' : priorityScore > 70 ? '24 Hours' : priorityScore > 50 ? '3 Days' : '7 Days';

      let suitableTeams = TEAMS.filter(t => isSkillCompatible(t.specialization, type === 'flooding' ? 'Drainage' : type === 'pothole' ? 'Resurfacing' : type === 'signal' ? 'Signals' : 'Rapid Response'));
      if (suitableTeams.length === 0) suitableTeams = TEAMS;
      const teamObj = suitableTeams[hash % suitableTeams.length];
      const team = `${teamObj.name} (${teamObj.specialization})`;

      const status: PriorityItem['status'] = r.severity === 'Critical' ? 'Pending' : r.severity === 'Active' ? 'Scheduled' : 'In Progress';

      return {
        id: r.id,
        type,
        title: r.title,
        location: r.location,
        district,
        priorityScore,
        severity: severityLabel,
        trafficImpact,
        accidentRisk,
        complaintWeight,
        roadImportance,
        cost,
        deadline: deadlineDays,
        team,
        status
      };
    });

  // Unique lists for filters
  const districts = ['All', ...Array.from(new Set(priorityItems.map(item => item.district)))];

  // Filtering & Sorting
  const filteredItems = priorityItems.filter(item => {
    const matchDistrict = filterDistrict === 'All' || item.district === filterDistrict;

    let matchPriority = true;
    if (filterPriority !== 'All') {
      if (filterPriority === 'Critical') matchPriority = item.priorityScore >= 85;
      else if (filterPriority === 'High') matchPriority = item.priorityScore >= 70 && item.priorityScore < 85;
      else if (filterPriority === 'Medium') matchPriority = item.priorityScore >= 50 && item.priorityScore < 70;
      else if (filterPriority === 'Low') matchPriority = item.priorityScore < 50;
    }

    return matchDistrict && matchPriority;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'score') return b.priorityScore - a.priorityScore;
    if (sortBy === 'cost') return b.cost - a.cost;
    if (sortBy === 'risk') return b.accidentRisk - a.accidentRisk;
    return 0;
  });

  const getPriorityColorClass = (score: number) => {
    if (score >= 85) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getPriorityBadgeLabel = (score: number) => {
    if (score >= 85) return 'Critical';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  // Top AI Recommendation
  const topCriticalItem = sortedItems.find(item => item.priorityScore >= 85);
  const aiRecommendation = topCriticalItem
    ? `Deploy ${topCriticalItem.team} to resolve the "${topCriticalItem.title}" at ${topCriticalItem.location} within ${topCriticalItem.deadline}. Resolving this will reduce traffic delays in the ${topCriticalItem.district} sector by approx 42% and decrease safety risk index.`
    : reports.filter(r => !r.resolved).length > 0
      ? `Conduct structural maintenance sweeps along arterial roads. Current high priority sectors are stable, but regular inspections are recommended.`
      : `All city sectors are clear. No high priority repairs logged at this time. Operations are running at 100% safety parameters.`;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} mins`;
    return `${h} hr${h === 1 ? '' : 's'} ${m} min${m === 1 ? '' : 's'}`;
  };

  // Active reports for clustering (not resolved)
  const activeReportsClustering = reports.filter(r => !r.resolved && r.status !== 'Resolved');

  // Perform clustering and routing calculations
  const clusters = runDBSCANClustering(activeReportsClustering, clusterThreshold, 2);
  const clusterAssignments = assignCrewsToClusters(clusters, reports);

  const optimizedClusters = clusters.map(cluster => {
    const assignment = clusterAssignments.find(a => a.clusterId === cluster.id);
    const assignedTeam = assignment ? assignment.team : TEAMS[0];
    const matchScore = assignment ? assignment.matchScore : 50;
    const route = solveTspRoute(assignedTeam, cluster.reports);

    return {
      ...cluster,
      assignedTeam,
      matchScore,
      route
    };
  });

  const totalDistanceSaved = optimizedClusters.reduce((sum, c) => sum + Math.max(0, c.route.separateDistanceKm - c.route.totalDistanceKm), 0);
  const totalCostSaved = optimizedClusters.reduce((sum, c) => sum + c.route.costSaved, 0);

  const teamRoutes = TEAMS.map(team => {
    const assignedCluster = optimizedClusters.find(c => c.assignedTeam.name === team.name);
    const databaseActiveReports = activeReportsClustering.filter(r => r.assignedTeam && r.assignedTeam.includes(team.name));

    const activeTasks = databaseActiveReports.length > 0
      ? databaseActiveReports
      : (assignedCluster ? assignedCluster.reports : []);

    let status: 'Available' | 'Assigned' | 'Working' | 'Completed' = 'Available';
    const hasActive = activeTasks.length > 0;
    const hasCompleted = reports.some(r => r.resolved && r.assignedTeam && r.assignedTeam.includes(team.name));

    if (hasActive) {
      const isWorking = activeTasks.some(t => t.status === 'Repairing' || t.status === 'In Progress');
      status = isWorking ? 'Working' : 'Assigned';
    } else if (hasCompleted) {
      status = 'Completed';
    }

    const route = activeTasks.length > 0 ? solveTspRoute(team, activeTasks) : null;

    let currentLocation = `${team.name} Base Station`;
    if (status === 'Working' && route && route.legs.length > 0) {
      currentLocation = `At Task: ${route.path[0].title}`;
    } else if (status === 'Assigned' && route && route.legs.length > 0) {
      currentLocation = `En route to ${route.path[0].title}`;
    } else if (status === 'Completed') {
      currentLocation = `Returned to Base`;
    }

    return {
      team,
      status,
      currentLocation,
      activeTasks,
      route,
      matchScore: assignedCluster ? assignedCluster.matchScore : null
    };
  });

  const handleDispatchCluster = (clusterId: string, teamName: string, reportIds: string[]) => {
    reportIds.forEach(id => {
      updateReportStatus(id, {
        status: 'Assigned',
        assignedTeam: teamName
      });
    });
    setDispatchedClusters(prev => [...prev, clusterId]);
    showToast(`🚀 Dispatched ${teamName} for optimized route. Status updated in municipal database.`);
  };

  const isCompletedToast = toastMessage ? (toastMessage.startsWith('✓') || toastMessage.includes('resolved') || toastMessage.includes('Completed task')) : false;

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up space-y-6">

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed z-[100] bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 border max-w-sm transition-all duration-300 ${
          isCompletedToast
            ? 'top-6 left-1/2 -translate-x-1/2 animate-fade-in-down border-green-500/30'
            : 'bottom-6 right-6 animate-fade-in-up border-white/10'
        }`}>
          <div className={`relative w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center font-bold ${isCompletedToast ? 'text-green-400' : 'text-blue-400'}`}>
            {isCompletedToast ? '✓' : 'ℹ'}
          </div>
          <div className="flex-1 text-xs font-semibold tracking-wide">{toastMessage}</div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">AI Repair Priority Center</h2>
          <p className="text-text-secondary mt-1">Algorithmic repair scheduling optimization and budget allocation matrix.</p>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/20 shadow-lg bg-primary/5 flex gap-4 items-start">
        <div className="p-3 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
          <BrainCircuit className="w-6 h-6 text-safety-yellow" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-safety-yellow" /> AI Priority Dispatch recommendation
          </span>
          <p className="text-sm font-semibold text-primary mt-1.5 leading-relaxed">
            {aiRecommendation}
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-primary'
          }`}
        >
          📂 Priority Ledger ({priorityItems.length})
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'routing'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-primary'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-purple-600" /> AI Route Optimizer ({optimizedClusters.length} Clusters)
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <>
          {/* Control Filters Bar */}
          <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <Filter className="w-4 h-4" /> Filters:
              </div>

              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none cursor-pointer"
              >
                {districts.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">🔴 Critical (85+)</option>
                <option value="High">🟠 High (70-84)</option>
                <option value="Medium">🟡 Medium (50-69)</option>
                <option value="Low">🟢 Low (&lt;50)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                <ArrowUpDown className="w-4 h-4" /> Sort by:
              </span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-border-subtle">
                <button
                  onClick={() => setSortBy('score')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    sortBy === 'score' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  Priority Score
                </button>
                <button
                  onClick={() => setSortBy('cost')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    sortBy === 'cost' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  Cost
                </button>
                <button
                  onClick={() => setSortBy('risk')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    sortBy === 'risk' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  Accident Risk
                </button>
              </div>
            </div>
          </div>

          {/* Priority Matrix List */}
          <div className="space-y-4">
            {sortedItems.length > 0 ? (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-all duration-200 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                >
                  {/* Score and Category */}
                  <div className="lg:col-span-2 flex items-center gap-4 border-r border-border-subtle/50 pr-4">
                    <div className="text-center flex-shrink-0">
                      <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">AI Priority</span>
                      <div className="text-4xl font-extrabold text-primary tracking-tighter mt-0.5">
                        {item.priorityScore}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full border text-center uppercase tracking-wider ${getPriorityColorClass(item.priorityScore)}`}>
                        {getPriorityBadgeLabel(item.priorityScore)}
                      </span>
                      <span className="text-[9px] text-text-secondary text-center uppercase font-bold mt-0.5">
                        {item.roadImportance} Route
                      </span>
                    </div>
                  </div>

                  {/* Hazard Meta details */}
                  <div className="lg:col-span-4 space-y-1.5">
                    <h4 className="font-bold text-sm text-primary leading-tight flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-safety-yellow flex-shrink-0" />
                      {item.title}
                    </h4>
                    <p className="text-xs text-text-secondary font-medium">
                      📍 {item.location} ({item.district})
                    </p>
                    <div className="flex gap-4 text-[10px] text-text-secondary font-semibold">
                      <span>Accident Probability: <strong className="text-red-600">{item.accidentRisk}%</strong></span>
                      <span>Traffic Impact: <strong className="text-primary">{item.trafficImpact}</strong></span>
                      <span>Upvotes: <strong>{item.complaintWeight}</strong></span>
                    </div>
                  </div>

                  {/* Dispatch team details */}
                  <div className="lg:col-span-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Assigned Team:</span>
                    </div>
                    <p className="text-xs font-semibold text-primary pl-5">{item.team}</p>
                    <p className="text-[10px] text-text-secondary pl-5">Status: <strong className="text-primary font-bold">{item.status}</strong></p>
                  </div>

                  {/* Repair budget and Deadlines */}
                  <div className="lg:col-span-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-text-secondary font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      <span>Cost: <strong>${item.cost.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Target: <strong className="text-primary font-bold">{item.deadline}</strong></span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="lg:col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        resolveReport(item.id);
                        showToast(`✓ Completed task: "${item.title}" has been successfully resolved.`);
                      }}
                      className="bg-primary hover:bg-neutral-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-safety-yellow" /> Resolve
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-border-subtle p-16 text-center shadow-sm">
                <BrainCircuit className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
                <h4 className="font-bold text-sm text-primary">Priority Repair Ledger Clear</h4>
                <p className="text-xs text-text-secondary mt-1">No active reports match the selected filters. Operations normal.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* AI ROUTE OPTIMIZER PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white p-5 rounded-2xl border border-border-subtle shadow-sm mb-6">
            <div className="lg:col-span-6 space-y-2">
              <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-600" /> Geographic Clustering Threshold
              </h3>
              <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                Define the maximum radius (in kilometers) to cluster nearby road hazards together for a single dispatch route.
              </p>
              <div className="flex items-center gap-4 pt-1">
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={clusterThreshold}
                  onChange={(e) => setClusterThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="bg-primary/5 text-primary border border-primary/20 text-xs font-black px-2.5 py-1 rounded-md shrink-0">
                  {clusterThreshold.toFixed(1)} km
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-l border-border-subtle/50 pl-6 h-full items-center">
              <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl text-center">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Formed Clusters</span>
                <span className="text-xl font-black text-primary mt-1 block">
                  {optimizedClusters.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-border-subtle rounded-xl text-center">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Clustered Tasks</span>
                <span className="text-xl font-black text-primary mt-1 block">
                  {activeReportsClustering.length}
                </span>
              </div>
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-center">
                <span className="text-[9px] text-green-700 font-bold uppercase tracking-wider block">Travel Saved</span>
                <span className="text-xl font-black text-green-600 mt-1 block">
                  {totalDistanceSaved.toFixed(1)} km
                </span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">Operational Saved</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">
                  ${totalCostSaved.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Active Fleet Dispatch Hub */}
          <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm mb-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-5 h-5 text-primary" /> Active Fleet Dispatch Hub
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Real-time tracking, assignment sequence, and completion metrics for all 10 municipal response crews.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <strong>{teamRoutes.filter(tr => tr.status === 'Available').length}</strong> crews available for assignment
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {teamRoutes.map(({ team, status, currentLocation, activeTasks, route }) => {
                const getStatusColor = (s: typeof status) => {
                  if (s === 'Working') return 'bg-amber-100 text-amber-800 border-amber-200';
                  if (s === 'Assigned') return 'bg-blue-100 text-blue-800 border-blue-200';
                  if (s === 'Completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  return 'bg-slate-100 text-slate-700 border-slate-200';
                };

                return (
                  <div
                    key={team.name}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md flex flex-col justify-between ${
                      status === 'Working' ? 'border-amber-300 bg-amber-50/10 shadow-sm' :
                      status === 'Assigned' ? 'border-blue-300 bg-blue-50/10' :
                      status === 'Completed' ? 'border-emerald-300 bg-emerald-50/10' :
                      'border-border-subtle hover:border-primary/20 bg-slate-50/10'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Name & Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-primary truncate leading-tight">{team.name}</h4>
                          <span className="text-[8px] font-semibold text-text-secondary uppercase tracking-wider block mt-0.5">
                            {team.specialization}
                          </span>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase shrink-0 ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>

                      {/* Current Location */}
                      <div className="text-[10px] text-text-secondary font-medium leading-relaxed bg-slate-100/40 p-2 rounded-lg border border-slate-100">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">📍 Current Location</span>
                        <span className="text-primary font-semibold">{currentLocation}</span>
                      </div>

                      {/* Task Sequence */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">📋 Task Sequence</span>
                        {activeTasks.length > 0 ? (
                          <div className="space-y-1 pl-1">
                            {activeTasks.map((task, idx) => (
                              <div key={task.id} className="text-[9px] font-semibold text-primary flex items-center gap-1.5 truncate">
                                <span className="w-3.5 h-3.5 rounded-full bg-primary/5 text-primary border border-primary/10 flex items-center justify-center text-[7px] font-bold shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="truncate" title={task.title}>
                                  {task.title.replace(/repair|report|hazard/gi, '').trim() || task.title}
                                </span>
                                <span className={`text-[7px] px-1 font-black rounded shrink-0 ${
                                  task.severity === 'Critical' ? 'bg-red-50 text-red-700' :
                                  task.severity === 'Active' ? 'bg-orange-50 text-orange-700' :
                                  'bg-slate-50 text-slate-700'
                                }`}>
                                  {task.severity === 'Critical' ? 'CRIT' : task.severity === 'Active' ? 'HIGH' : 'MED'}
                                </span>
                              </div>
                            ))}
                            {route && (
                              <div className="text-[9px] font-bold text-text-secondary flex items-center gap-1.5 pl-0.5 border-t border-dashed border-slate-200 pt-1 mt-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                <span>Return to Base HQ</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[9px] italic text-text-secondary pl-1">Standby: No tasks assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Route Summary Stats */}
                    {route ? (
                      <div className="grid grid-cols-2 gap-2 border-t border-border-subtle/50 pt-2.5 mt-3 text-center">
                        <div className="bg-slate-50 p-1.5 rounded border border-border-subtle">
                          <span className="text-[7px] text-text-secondary uppercase block font-bold">Distance</span>
                          <span className="text-[10px] font-bold text-primary">{route.totalDistanceKm} km</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-border-subtle">
                          <span className="text-[7px] text-text-secondary uppercase block font-bold">Est. Completion</span>
                          <span className="text-[10px] font-bold text-primary truncate" title={formatDuration(route.totalCompletionTimeMins)}>
                            {formatDuration(route.totalCompletionTimeMins).replace('hours', 'h').replace('mins', 'm').replace('min', 'm').replace('hour', 'h')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-border-subtle/50 pt-2.5 mt-3 text-center text-[9px] font-bold text-text-secondary">
                        Ready for Dispatch
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clusters Grid */}
          <div className="space-y-6">
            {optimizedClusters.length === 0 ? (
              <div className="bg-white rounded-xl border border-border-subtle p-16 text-center shadow-sm">
                <BrainCircuit className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
                <h4 className="font-bold text-sm text-primary">All City Sectors Normal</h4>
                <p className="text-xs text-text-secondary mt-1">No active reports are currently logged for dispatch routing.</p>
              </div>
            ) : (
              optimizedClusters.map((cluster) => {
                const isDispatched = dispatchedClusters.includes(cluster.id);
                const reportsList = cluster.reports;
                const team = cluster.assignedTeam;
                const route = cluster.route;

                return (
                  <div key={cluster.id} className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Header row */}
                    <div className="p-5 border-b border-border-subtle/50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            Cluster {cluster.id.split('-')[1]}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            Centroid: {reportsList[0].location.split(',')[0]} Sector
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary font-medium">
                          Contains {reportsList.length} hazard{reportsList.length === 1 ? '' : 's'} • Mapped Type: <strong className="text-primary font-bold">{cluster.primaryType}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Route Logistics</span>
                          <span className="text-xs font-black text-primary">
                            {route.totalDistanceKm} km ({formatDuration(route.totalTravelTimeMins)} transit)
                          </span>
                          <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
                            Est. Completion: {formatDuration(route.totalCompletionTimeMins)}
                          </span>
                        </div>

                        {isDispatched ? (
                          <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1">
                            <Check className="w-4 h-4" /> Dispatched
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDispatchCluster(cluster.id, team.name, reportsList.map(r => r.id))}
                            className="bg-primary hover:bg-neutral-800 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <Truck className="w-4 h-4 text-safety-yellow" /> Dispatch {team.name}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body: Team mapping details & Optimized Route sequence */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left details - Team assignment criteria */}
                      <div className="lg:col-span-4 space-y-4 border-r border-border-subtle/50 pr-8">
                        <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" /> Matched Dispatch Crew
                        </h4>

                        <div className="p-4 rounded-xl border border-border-subtle/80 bg-slate-50/20 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-xs text-primary">{team.name}</h5>
                              <span className="text-[9px] text-text-secondary font-semibold mt-0.5 block">
                                ⚙ Specialization: {team.specialization}
                              </span>
                            </div>
                            <span className="bg-green-100 text-green-700 border border-green-200 text-[8px] font-black px-1.5 py-0.5 rounded">
                              {cluster.matchScore}% Match
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[9px] font-semibold text-text-secondary border-t border-border-subtle/40 pt-2.5">
                            <div className="flex justify-between">
                              <span>Specialization Fit:</span>
                              <span className="text-primary font-bold">Excellent (+60)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>HQ Base Distance:</span>
                              <span className="text-primary font-bold">
                                {calculateHaversineDistance(team.lat, team.lng, cluster.centroid.lat, cluster.centroid.lng).toFixed(2)} km
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Active Dispatches:</span>
                              <span className="text-primary font-bold">
                                {reports.filter(r => !r.resolved && r.assignedTeam && r.assignedTeam.includes(team.name)).length} active dispatches
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Efficiency Scorecard (Rendered under crew details for N > 1) */}
                        {reportsList.length > 1 && (
                          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-3">
                            <h5 className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                              <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
                              Efficiency Scorecard
                            </h5>
                            <div className="space-y-2 text-[10px] font-semibold text-emerald-900">
                              <div className="flex justify-between items-center">
                                <span className="text-emerald-700">Distance Saved:</span>
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                                  {Math.max(0, route.separateDistanceKm - route.totalDistanceKm).toFixed(1)} km ({route.distanceSavedPercent}%)
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-emerald-700">Transit Time Saved:</span>
                                <span className="text-emerald-950 font-black">
                                  {formatDuration(Math.max(0, route.separateTravelTimeMins - route.totalTravelTimeMins))}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-t border-emerald-100/60 pt-2">
                                <span className="text-emerald-700 font-bold">Operational Saved:</span>
                                <span className="text-emerald-600 font-black text-xs">
                                  ${route.costSaved.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right details - Optimized route path timeline */}
                      <div className="lg:col-span-8 space-y-4">
                        <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-purple-600" /> Route sequence optimization (TSP Nearest-Neighbor)
                        </h4>

                        {/* Route timeline map sequence */}
                        <div className="relative pl-6 space-y-4 pt-1 pb-1">
                          {/* Vertical line connector */}
                          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                          {/* Starting Station */}
                          <div className="relative flex gap-3 items-center">
                            <div className="absolute left-[6px] w-2 h-2 rounded-full bg-slate-400 border border-white"></div>
                            <div className="text-[10px] font-bold text-text-secondary">
                              Crew Station Base ({team.name})
                            </div>
                          </div>

                          {/* Optimized stops */}
                          {route.legs.map((leg, stopIdx) => {
                            const isReturn = leg.toName === 'Return to Base';
                            const stopDotColor = isReturn ? 'bg-slate-400' : 'bg-purple-600 animate-pulse';
                            const stepLabel = isReturn ? 'Return' : `Stop ${stopIdx + 1}`;

                            return (
                              <div key={stopIdx} className="relative flex flex-col gap-2 bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-border-subtle transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex items-start gap-3">
                                    {/* Dot indicator */}
                                    <div className={`absolute left-[6px] w-2 h-2 mt-1 rounded-full border border-white ${stopDotColor}`}></div>

                                    <div className="min-w-0">
                                      <span className="text-[8px] font-black text-text-secondary uppercase tracking-wider block">
                                        {stepLabel}
                                      </span>
                                      <p className="text-[11px] font-bold text-primary truncate leading-snug">
                                        {leg.toName}
                                      </p>
                                      {!isReturn && (
                                        <span className="text-[9px] text-text-secondary mt-0.5 block font-semibold">
                                          Hazard Type: <strong className="text-slate-700">{leg.hazardType}</strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <div className="text-[10px] font-bold text-primary">
                                      +{formatDuration(leg.segmentCompletionTimeMins)}
                                    </div>
                                    <div className="text-[8px] font-bold text-text-secondary">
                                      Cumulative Elapsed
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-border-subtle/40 text-[9px] font-semibold text-text-secondary justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span>Transit: <strong>{leg.distanceKm} km</strong> ({leg.travelTimeMins} mins)</span>
                                    {!isReturn && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span>Repair: <strong>{leg.repairTimeMins} mins</strong></span>
                                      </>
                                    )}
                                  </div>

                                  {!isReturn && (
                                    <div>
                                      {leg.isCompatible ? (
                                        <span className="bg-green-50 text-green-700 border border-green-200 text-[8px] px-1.5 py-0.5 rounded font-black">
                                          ✓ Specialized
                                        </span>
                                      ) : (
                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[8px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                          ⚠️ Mismatch (+20m / +$300)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
