'use client';

import { Department, Institute, Unit } from '@/types/organization';
import { ChevronDown, ChevronRight, Building2, Building, Factory } from 'lucide-react';
import { useState } from 'react';

interface OrganizationChartProps {
  departments: Department[];
  institutes: Institute[];
  units: Unit[];
}

export default function OrganizationChart({ departments, institutes, units }: OrganizationChartProps) {
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedInsts, setExpandedInsts] = useState<string[]>([]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleInstitute = (instId: string) => {
    setExpandedInsts(prev => 
      prev.includes(instId) 
        ? prev.filter(id => id !== instId)
        : [...prev, instId]
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="space-y-2">
        {departments.map(dept => (
          <div key={dept.id} className="space-y-2">
            <div 
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => toggleDepartment(dept.id)}
            >
              {expandedDepts.includes(dept.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <Building2 className="text-blue-500" size={20} />
              <span className="font-medium">{dept.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">({dept.code})</span>
            </div>

            {expandedDepts.includes(dept.id) && (
              <div className="ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-2">
                {institutes
                  .filter(inst => inst.departmentId === dept.id)
                  .map(inst => (
                    <div key={inst.id} className="space-y-2">
                      <div 
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                        onClick={() => toggleInstitute(inst.id)}
                      >
                        {expandedInsts.includes(inst.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <Building className="text-green-500" size={20} />
                        <span className="font-medium">{inst.name}</span>
                      </div>

                      {expandedInsts.includes(inst.id) && (
                        <div className="ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-2">
                          {units
                            .filter(unit => unit.instituteId === inst.id)
                            .map(unit => (
                              <div 
                                key={unit.id}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                              >
                                <Factory className="text-purple-500" size={20} />
                                <span>{unit.name}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 