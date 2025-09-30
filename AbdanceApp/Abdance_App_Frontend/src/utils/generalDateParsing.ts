function generalDateParsing(data: any) {
    const toISO = (dateString?: string | null) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().replace("Z", "");//Se quita la Z
    };

    return toISO(data)
}
export default generalDateParsing;