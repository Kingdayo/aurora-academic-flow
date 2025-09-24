import GroupManager from "@/components/GroupManager";

export default function GroupManagerStoryboard() {
  const handleGroupSelect = (groupId: string) => {
    console.log("Selected group:", groupId);
  };

  return (
    <div className="bg-white min-h-screen">
      <GroupManager onGroupSelect={handleGroupSelect} />
    </div>
  );
}
