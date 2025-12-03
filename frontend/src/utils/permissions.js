export const hasPermission = (user, permissionName) => {
    if (!user) return false;
    // Admin role override
    if (user.roles && user.roles.includes('Admin')) return true;

    return user.permissions && user.permissions.includes(permissionName);
};

export const hasAnyPermission = (user, permissionsList) => {
    if (!user) return false;
    if (user.roles && user.roles.includes('Admin')) return true;

    if (!user.permissions) return false;
    return permissionsList.some(perm => user.permissions.includes(perm));
};

export const hasRole = (user, roleName) => {
    if (!user) return false;
    return user.roles && user.roles.includes(roleName);
};

export const getPrimaryRole = (user) => {
    if (!user || !user.roles) return 'Guest';
    if (user.roles.includes('Admin')) return 'Admin';
    if (user.roles.includes('Incharge')) return 'Incharge';
    if (user.roles.includes('Volunteer')) return 'Volunteer';
    return 'Student';
};
