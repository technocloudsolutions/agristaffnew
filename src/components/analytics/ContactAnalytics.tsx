import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { Users, Building2, UserCheck, UserX } from 'lucide-react';

interface AnalyticsData {
  totalContacts: number;
  activeContacts: number;
  personContacts: number;
  instituteContacts: number;
  departmentWise: { [key: string]: number };
  statusWise: { [key: string]: number };
}

const ContactAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalContacts: 0,
    activeContacts: 0,
    personContacts: 0,
    instituteContacts: 0,
    departmentWise: {},
    statusWise: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get all contacts
        const contactsRef = collection(db, 'contacts');
        const allContactsQuery = await getDocs(contactsRef);
        
        const data: AnalyticsData = {
          totalContacts: 0,
          activeContacts: 0,
          personContacts: 0,
          instituteContacts: 0,
          departmentWise: {},
          statusWise: {},
        };

        allContactsQuery.forEach((doc) => {
          const contact = doc.data();
          
          // Count total contacts
          data.totalContacts++;
          
          // Count active contacts
          if (contact.status === 'active') {
            data.activeContacts++;
            
            // Only count type and status for active contacts
            if (contact.contactType === 'Person') {
              data.personContacts++;
            } else if (contact.contactType === 'Institute') {
              data.instituteContacts++;
            }

            // Count by department (only active contacts)
            if (contact.departmentId) {
              data.departmentWise[contact.departmentId] = (data.departmentWise[contact.departmentId] || 0) + 1;
            }

            // Count by status (only active contacts)
            if (contact.contactStatus) {
              data.statusWise[contact.contactStatus] = (data.statusWise[contact.contactStatus] || 0) + 1;
            }
          }
        });

        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1f2937] p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Contacts</p>
              <h3 className="text-2xl font-semibold text-white mt-1">{analytics.totalContacts}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-[#1f2937] p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Active Contacts</p>
              <h3 className="text-2xl font-semibold text-white mt-1">{analytics.activeContacts}</h3>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-[#1f2937] p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Person Contacts</p>
              <h3 className="text-2xl font-semibold text-white mt-1">{analytics.personContacts}</h3>
            </div>
            <UserCheck className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-[#1f2937] p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Institute Contacts</p>
              <h3 className="text-2xl font-semibold text-white mt-1">{analytics.instituteContacts}</h3>
            </div>
            <Building2 className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-[#1f2937] p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-white mb-4">Contact Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.statusWise).map(([status, count]) => (
            <div key={status} className="bg-[#374151] p-4 rounded-lg">
              <p className="text-gray-400">{status}</p>
              <p className="text-xl font-semibold text-white mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactAnalytics; 